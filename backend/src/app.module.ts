import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HackathonsModule } from './hackathons/hackathons.module';
import { CategoriesModule } from './categories/categories.module';
import { ChallengesModule } from './challenges/challenges.module';
import { CommunicationChannelsModule } from './communication-channels/communication-channels.module';
import { RubricsModule } from './rubrics/rubrics.module';
import { TeamsModule } from './teams/teams.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { TopicsModule } from './topics/topics.module';
import { UploadModule } from './upload/upload.module';
import { SigaModule } from './siga/siga.module';
import { EmailModule } from './email/email.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { JudgeAssignmentsModule } from './judge-assignments/judge-assignments.module';
import { LoggerModule } from './common/logger/logger.module';
import { CacheModule } from './common/cache/cache.module';
import { NotificationsModule } from './common/notifications/notifications.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { User, Campista, Topic, Registration } from './entities';
import { Hackathon } from './entities/hackathon.entity';
import { Category } from './entities/category.entity';
import { Challenge } from './entities/challenge.entity';
import { CommunicationChannel } from './entities/communication-channel.entity';
import { Rubric } from './entities/rubric.entity';
import { Team } from './entities/team.entity';
import { Evaluation } from './entities/evaluation.entity';
import { Submission } from './entities/submission.entity';
import { JudgeAssignment } from './entities/judge-assignment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get('NODE_ENV', 'development');
        const databaseUrl = configService.get<string>('DATABASE_URL');

        // Parse PostgreSQL connection URL
        const url = new URL(databaseUrl);

        return {
          type: 'postgres',
          host: url.hostname,
          port: parseInt(url.port) || 5432,
          username: url.username,
          password: url.password,
          database: url.pathname.slice(1).split('?')[0],
          entities: [
            User,
            Campista,
            Hackathon,
            Category,
            Challenge,
            CommunicationChannel,
            Rubric,
            Team,
            Evaluation,
            Topic,
            Registration,
            Submission,
            JudgeAssignment,
          ],
          synchronize: nodeEnv === 'development', // Auto-creates tables in development
          logging: nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
          ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    // Global modules
    LoggerModule,
    CacheModule,
    NotificationsModule,
    // Feature modules
    AuthModule,
    HackathonsModule,
    CategoriesModule,
    ChallengesModule,
    CommunicationChannelsModule,
    RubricsModule,
    TeamsModule,
    EvaluationsModule,
    TopicsModule,
    UploadModule,
    SigaModule,
    EmailModule,
    SubmissionsModule,
    JudgeAssignmentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
