import { ClassArray, clsx as classNames } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const clsx = (...args: ClassArray) => {
  return twMerge(classNames(args))
}
