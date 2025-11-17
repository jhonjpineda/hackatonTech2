import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationsOptimizedService } from './evaluations-optimized.service';
import { Evaluation } from '../entities/evaluation.entity';
import { Rubric } from '../entities/rubric.entity';
import { Team } from '../entities/team.entity';
import { User } from '../entities/user.entity';
import { CacheService } from '../common/cache/cache.service';
import { LoggerService } from '../common/logger/logger.service';

describe('EvaluationsOptimizedService', () => {
  let service: EvaluationsOptimizedService;
  let evaluationRepository: jest.Mocked<Repository<Evaluation>>;
  let rubricRepository: jest.Mocked<Repository<Rubric>>;
  let teamRepository: jest.Mocked<Repository<Team>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let cacheService: jest.Mocked<CacheService>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsOptimizedService,
        {
          provide: getRepositoryToken(Evaluation),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Rubric),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Team),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            delPattern: jest.fn(),
            getOrSet: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EvaluationsOptimizedService>(
      EvaluationsOptimizedService,
    );
    evaluationRepository = module.get(getRepositoryToken(Evaluation));
    rubricRepository = module.get(getRepositoryToken(Rubric));
    teamRepository = module.get(getRepositoryToken(Team));
    userRepository = module.get(getRepositoryToken(User));
    cacheService = module.get(CacheService);
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getJudgeProgressForTeam', () => {
    it('should return progress with cached data', async () => {
      const mockProgress = {
        totalRubrics: 5,
        evaluatedRubrics: 3,
        pendingRubrics: 2,
        percentageComplete: 60,
        evaluations: [],
      };

      cacheService.getOrSet.mockResolvedValue(mockProgress);

      const result = await service.getJudgeProgressForTeam(
        'judge-1',
        'team-1',
        'challenge-1',
      );

      expect(result).toEqual(mockProgress);
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });
  });

  describe('getTeamScore', () => {
    it('should calculate team score correctly', async () => {
      const mockScore = {
        teamId: 'team-1',
        challengeId: 'challenge-1',
        totalScore: 85,
        maxScore: 100,
        percentageScore: 85,
        details: [],
        completionStatus: 'complete' as const,
      };

      cacheService.getOrSet.mockResolvedValue(mockScore);

      const result = await service.getTeamScore('team-1', 'challenge-1');

      expect(result).toEqual(mockScore);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });
  });

  describe('clearAllCache', () => {
    it('should clear all evaluation caches', async () => {
      cacheService.delPattern.mockResolvedValue(10);

      await service.clearAllCache();

      expect(cacheService.delPattern).toHaveBeenCalledWith('evaluations:*');
      expect(cacheService.delPattern).toHaveBeenCalledWith('score:*');
      expect(cacheService.delPattern).toHaveBeenCalledWith('leaderboard:*');
      expect(logger.log).toHaveBeenCalledWith(
        'All evaluation caches cleared',
      );
    });
  });
});
