import { Router } from 'express';
import { getSettings, updateSettings } from '../storage.ts';
import { validateSettingsBody } from '../validation.ts';

export const settingsRouter = Router();

settingsRouter.get('/', async (_req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

settingsRouter.put('/', async (req, res, next) => {
  try {
    const payload = validateSettingsBody(req.body);
    const settings = await updateSettings(payload);
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});
