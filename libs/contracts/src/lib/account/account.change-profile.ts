import { IsString } from 'class-validator';
import { IUser } from '@microservices-nestjs/interfaces';

export namespace AccountChangeProfile {
  export const topic = 'account.change-profile.query';

  export class Request {
    @IsString()
    id: string;

    @IsString()
    user: Pick<IUser, 'displayName'>;
  }

  export class Response {}
}
