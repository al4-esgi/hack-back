import { user } from './user.entity';

export const schema = { user };
export type Schema = typeof schema;
export type SchemaName = keyof Schema;



export type { SelectUser } from './user.entity';
