import { Matches, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ConsultBenefitsDTO {
  @ApiProperty({
    description: 'CPF document number (11 digits)',
    example: '12345678901',
    minLength: 11,
    maxLength: 11,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.replace(/\D/g, ''))
  @Matches(/^\d{11}$/, {
    each: true,
    message: 'The document must have exactly 11 digits',
  })
  document: string;
}

export class BenefitDTO {
  @ApiProperty({
    description: 'Benefit number',
    example: '12345678901',
  })
  number: string;

  @ApiProperty({
    description: 'Benefit code',
    example: '33',
  })
  code: string;
}

export class ConsultBenefitsResponseDTO {
  @ApiProperty({
    description: 'CPF document number',
    example: '12345678901',
  })
  cpf: string;

  @ApiProperty({
    description: 'List of benefits',
    type: [BenefitDTO],
    example: [
      {
        number: '99999999999',
        code: '33',
      },
      {
        number: '99999999999',
        code: '42',
      },
    ],
  })
  benefitsData: BenefitDTO[];
}
