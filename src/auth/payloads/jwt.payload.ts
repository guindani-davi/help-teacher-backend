import { User } from '../../users/model/user.model';

export type JwtPayload = Omit<User, 'hashedPassword'>;
