import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from '../dtos/api-responses.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Healthcheck' })
  @ApiOkResponse({ type: HealthResponseDto })
  check(): { status: string } {
    return { status: 'ok' };
  }
}
