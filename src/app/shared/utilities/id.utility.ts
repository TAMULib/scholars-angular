import { v4 as uuidv4 } from 'uuid';

export const id = (): string => {
  return `scholars-id-${uuidv4()}`;
};
