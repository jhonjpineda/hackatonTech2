import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LoggerService } from '../logger/logger.service';
import { Injectable } from '@nestjs/common';

export interface JudgeNotification {
  type: 'new_submission' | 'evaluation_reminder' | 'assignment_update' | 'system';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedJudges: Map<string, Set<string>> = new Map(); // juezId -> Set of socketIds

  constructor(private logger: LoggerService) {
    this.logger.setContext('NotificationsGateway');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove from connected judges
    for (const [juezId, socketIds] of this.connectedJudges.entries()) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.connectedJudges.delete(juezId);
      }
    }
  }

  @SubscribeMessage('judge:register')
  handleJudgeRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { juezId: string },
  ) {
    const { juezId } = data;

    if (!this.connectedJudges.has(juezId)) {
      this.connectedJudges.set(juezId, new Set());
    }

    this.connectedJudges.get(juezId).add(client.id);
    client.join(`judge:${juezId}`);

    this.logger.log(`Judge ${juezId} registered with socket ${client.id}`);

    // Send confirmation
    client.emit('judge:registered', {
      success: true,
      message: 'Successfully registered for notifications',
    });
  }

  @SubscribeMessage('judge:unregister')
  handleJudgeUnregister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { juezId: string },
  ) {
    const { juezId } = data;

    if (this.connectedJudges.has(juezId)) {
      this.connectedJudges.get(juezId).delete(client.id);
      if (this.connectedJudges.get(juezId).size === 0) {
        this.connectedJudges.delete(juezId);
      }
    }

    client.leave(`judge:${juezId}`);

    this.logger.log(`Judge ${juezId} unregistered from socket ${client.id}`);
  }

  /**
   * Notify a specific judge
   */
  notifyJudge(juezId: string, notification: JudgeNotification) {
    this.server.to(`judge:${juezId}`).emit('notification', notification);

    this.logger.log(
      `Notification sent to judge ${juezId}: ${notification.title}`,
    );
  }

  /**
   * Notify multiple judges
   */
  notifyJudges(juezIds: string[], notification: JudgeNotification) {
    juezIds.forEach((juezId) => {
      this.notifyJudge(juezId, notification);
    });
  }

  /**
   * Notify all connected judges
   */
  notifyAllJudges(notification: JudgeNotification) {
    // Get all connected judge room IDs
    const connectedJudges = this.getConnectedJudges();
    connectedJudges.forEach((juezId) => {
      this.notifyJudge(juezId, notification);
    });

    this.logger.log(`Broadcast notification to all judges: ${notification.title}`);
  }

  /**
   * Send new submission notification
   */
  notifyNewSubmission(
    juezId: string,
    teamName: string,
    challengeName: string,
    submissionId: string,
  ) {
    const notification: JudgeNotification = {
      type: 'new_submission',
      title: 'Nueva Entrega Disponible',
      message: `El equipo "${teamName}" ha enviado una entrega para el desafío "${challengeName}"`,
      data: {
        submissionId,
        teamName,
        challengeName,
      },
      priority: 'high',
      timestamp: new Date(),
    };

    this.notifyJudge(juezId, notification);
  }

  /**
   * Send evaluation reminder
   */
  notifyEvaluationReminder(
    juezId: string,
    pendingCount: number,
    hackathonName: string,
  ) {
    const notification: JudgeNotification = {
      type: 'evaluation_reminder',
      title: 'Evaluaciones Pendientes',
      message: `Tienes ${pendingCount} evaluaciones pendientes en "${hackathonName}"`,
      data: {
        pendingCount,
        hackathonName,
      },
      priority: 'medium',
      timestamp: new Date(),
    };

    this.notifyJudge(juezId, notification);
  }

  /**
   * Send assignment update notification
   */
  notifyAssignmentUpdate(
    juezId: string,
    hackathonName: string,
    teamsCount: number,
  ) {
    const notification: JudgeNotification = {
      type: 'assignment_update',
      title: 'Asignación Actualizada',
      message: `Tu asignación en "${hackathonName}" ha sido actualizada. Ahora tienes ${teamsCount} equipos asignados`,
      data: {
        hackathonName,
        teamsCount,
      },
      priority: 'high',
      timestamp: new Date(),
    };

    this.notifyJudge(juezId, notification);
  }

  /**
   * Get connected judges count
   */
  getConnectedJudgesCount(): number {
    return this.connectedJudges.size;
  }

  /**
   * Check if a judge is connected
   */
  isJudgeConnected(juezId: string): boolean {
    return this.connectedJudges.has(juezId) && this.connectedJudges.get(juezId).size > 0;
  }

  /**
   * Get all connected judges
   */
  getConnectedJudges(): string[] {
    return Array.from(this.connectedJudges.keys());
  }
}
