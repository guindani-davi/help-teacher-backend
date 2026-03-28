import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

export function AtLeastOneField(
  fields: string[],
  validationOptions?: ValidationOptions,
) {
  return function (constructor: new (...args: unknown[]) => object) {
    registerDecorator({
      name: 'atLeastOneField',
      target: constructor,
      propertyName: fields[0]!,
      options: {
        message: `At least one of the following fields must be provided: ${fields.join(', ')}`,
        ...validationOptions,
      },
      validator: {
        validate(_value: unknown, args: ValidationArguments): boolean {
          const object = args.object as Record<string, unknown>;
          return fields.some(
            (field) => object[field] !== undefined && object[field] !== null,
          );
        },
      },
    });
  };
}
