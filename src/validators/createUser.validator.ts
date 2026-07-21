import { z } from "zod";
import { ProfileImageSchema } from './profile-image.validator'

export const CreateUserSchema = z.object({
  name: z.string().min(3),
  nickname: z.string().min(2),
  email: z.string().email(),
  cpf: z.string().min(11),
  phone: z.string().min(8),
  password: z.string().min(6),
  profileImage: ProfileImageSchema.optional(),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
