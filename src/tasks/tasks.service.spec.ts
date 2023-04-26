import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';
import { User } from '../auth/user.entity';

const mockUser: User = {
  username: 'testUser',
  id: 'testId',
  password: 'testPassword',
  tasks: [],
};

const tasks: Task[] = [];

const mockTaskRepository = () => ({
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockReturnThis().mockResolvedValue(tasks),
  })),
  create: jest.fn(),
  delete: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

const TASK_REPOSITORY_TOKEN = getRepositoryToken(Task);

describe('Task Service', () => {
  let taskService: TasksService;
  let taskRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: TASK_REPOSITORY_TOKEN,
          useFactory: mockTaskRepository,
        },
      ],
    }).compile();

    taskService = module.get<TasksService>(TasksService);
    taskRepository = module.get<Repository<Task>>(TASK_REPOSITORY_TOKEN);
  });

  it('defines Tasks Service', () => {
    expect(taskService).toBeDefined();
  });

  it('defines Tasks Repository', () => {
    expect(taskRepository).toBeDefined();
  });

  describe('createTask', () => {
    it('calls TasksService to create a new task, and return the result', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test title',
        description: 'Test description',
      };
      const newTask: Task = {
        id: 'testId',
        status: TaskStatus.OPEN,
        user: mockUser,
        ...createTaskDto,
      };
      taskRepository.create.mockResolvedValue({
        id: 'testId',
        status: TaskStatus.OPEN,
        user: mockUser,
        ...createTaskDto,
      });
      const result = await taskService.createTask(createTaskDto, mockUser);
      tasks.push(result);
      expect(JSON.stringify(result)).toEqual(JSON.stringify(newTask));
    });

    describe('getTasks', () => {
      it('calls TaskService.getTasks() should return 1 task in the tasks array after creating a new task', async () => {
        const result = await taskService.getTasks({}, mockUser);
        expect(result.length).toEqual(1);
      });

      it('calls TaskService.getTasks() and returns the result', async () => {
        const result = await taskService.getTasks({}, mockUser);
        expect(result).toEqual(tasks);
      });
    });

    describe('getTaskById', () => {
      it('calls TaskService.getTaskById() should return one', async () => {
        taskRepository.findOne.mockResolvedValue(tasks[0]);
        const result = await taskService.getTaskById(tasks[0].id, mockUser);
        expect(result).toEqual(tasks[0]);
      });

      it('calls TaskService.getTaskById() should return a NotFoundException', () => {
        taskRepository.findOne.mockResolvedValue(null);
        const result = taskService.getTaskById('someRandomId', mockUser);
        expect(result).rejects.toThrow(NotFoundException);
      });
    });

    describe('Update Task', () => {
      it('TaskService.updateTaskStatus() should update the task status and return a the updated task, only if given a valid taskId', async () => {
        taskRepository.findOne.mockResolvedValue(tasks[0]);
        const result = await taskService.updateTaskStatus(
          tasks[0].id,
          TaskStatus.DONE,
          mockUser,
        );
        expect(result.status).toEqual(TaskStatus.DONE);
      });
    });
  });
});
