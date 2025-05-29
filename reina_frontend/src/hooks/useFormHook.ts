
import {useForm} from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod";

import {z} from 'zod'
import { useMutation } from '@tanstack/react-query';

type ApiFunction<T, R = unknown> = (data: T) => Promise<R>;

export const useFormHook = <T extends z.ZodType>(schema:T, apiFunction:ApiFunction<z.infer<T>>) => {

  type FormData = z.infer<T>

  const {register,handleSubmit,formState:{errors}} = useForm<FormData>({
    resolver:zodResolver(schema)
  })

  const mutation = useMutation({
    mutationFn:apiFunction,
  })

  return {
    register,
    handleSubmit:handleSubmit(data => mutation.mutate(data)),
    errors,
    isPending:mutation.isPending,
    apiError:mutation.isError,
    isSuccess:mutation.isSuccess,
    mutationError: mutation.error,
    mutationData:mutation.data
  }
}


