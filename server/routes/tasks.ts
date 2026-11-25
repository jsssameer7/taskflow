import { Router } from 'express';
import {
  clearCompletedTasks,
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  toggleTaskComplete,
  updateTask,
} from '../storage.ts';
import {
  ValidationError,
  assertValidTaskId,
  parseListQuery,
  validateCreateTaskBody,
  validateUpdateTaskBody,
} from '../validation.ts';

export const tasksRouter = Router();

// GET /api/tasks — List tasks with optional search, status, priority, category, and sorting
tasksRouter.get('/', async (req, res, next) => {
  try {
    const query = parseListQuery(req.query as Record<string, unknown>);
    const tasks = await listTasks(query);
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/completed — Remove all completed tasks
tasksRouter.delete('/completed', async (_req, res, next) => {
  try {
    const deletedCount = await clearCompletedTasks();
    res.json({ deletedCount });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id — Retrieve a single task by ID
tasksRouter.get('/:id', async (req, res, next) => {
  try {
    const id = assertValidTaskId(req.params.id);
    const task = await getTaskById(id);
    if (!task) {
      throw new ValidationError('Task not found.', ['No task exists with that identifier.'], 404);
    }
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks — Create a new task
tasksRouter.post('/', async (req, res, next) => {
  try {
    const input = validateCreateTaskBody(req.body);
    const task = await createTask(input);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id — Update an existing task
tasksRouter.put('/:id', async (req, res, next) => {
  try {
    const id = assertValidTaskId(req.params.id);
    const patch = validateUpdateTaskBody(req.body);
    const task = await updateTask(id, patch);
    if (!task) {
      throw new ValidationError('Task not found.', ['No task exists with that identifier.'], 404);
    }
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id/complete — Toggle or set task completion status
tasksRouter.patch('/:id/complete', async (req, res, next) => {
  try {
    const id = assertValidTaskId(req.params.id);
    let explicitCompleted: boolean | undefined;
    if (req.body && typeof req.body === 'object' && 'completed' in req.body) {
      if (typeof req.body.completed !== 'boolean') {
        throw new ValidationError('Completed status must be a boolean.');
      }
      explicitCompleted = req.body.completed;
    }
    const task = await toggleTaskComplete(id, explicitCompleted);
    if (!task) {
      throw new ValidationError('Task not found.', ['No task exists with that identifier.'], 404);
    }
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id — Delete a single task
tasksRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = assertValidTaskId(req.params.id);
    const deleted = await deleteTask(id);
    if (!deleted) {
      throw new ValidationError('Task not found.', ['No task exists with that identifier.'], 404);
    }
    res.json({ deletedId: deleted._id, task: deleted });
  } catch (err) {
    next(err);
  }
});
