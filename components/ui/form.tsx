import * as React from "react"
import { UseFormReturn, FieldValues, Path, useForm, FormProvider } from "react-hook-form"

interface FormProps<T extends FieldValues> extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'children'> {
  form: UseFormReturn<T>;
  children: React.ReactNode;
}

export const Form = <T extends FieldValues>({ form, children, ...props }: FormProps<T>) => (
  <FormProvider {...form}>
    <form {...props}>{children}</form>
  </FormProvider>
);

export const FormControl = ({ children }: { children?: React.ReactNode }) => (
  <div>{children}</div>
);

export const FormDescription = ({ children }: { children?: React.ReactNode }) => <p className="text-sm text-gray-500">{children}</p>;
export const FormItem = ({ children }: { children?: React.ReactNode }) => <div className="space-y-1">{children}</div>;
export const FormLabel = ({ children }: { children?: React.ReactNode }) => <label className="font-medium">{children}</label>;
export const FormMessage = ({ children }: { children?: React.ReactNode }) => <p className="text-sm text-red-500">{children}</p>;

interface FormFieldProps<T extends FieldValues> {
  control: UseFormReturn<T>['control'];
  name: Path<T>;
  render: ({ field }: { field: any }) => React.ReactNode;
}

export const FormField = <T extends FieldValues>({ 
  control, 
  name, 
  render
}: FormFieldProps<T>) => (
  <div className="space-y-2">{render({ field: { name, control } })}</div>
); 