import z from 'zod';

export const shellSchema = z.union([
  z.literal('/bin/bash'),
  z.literal('/bin/zsh'),
]);

export type ShellSchema = z.infer<typeof shellSchema>;

export const SHELL_SCHEMA_OPTIONS: Record<ShellSchema, boolean> = {
  '/bin/bash': true,
  '/bin/zsh': true,
};
