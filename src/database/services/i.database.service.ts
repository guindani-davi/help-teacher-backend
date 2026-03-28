import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

export abstract class IDatabaseService extends SupabaseClient<Database> {}
