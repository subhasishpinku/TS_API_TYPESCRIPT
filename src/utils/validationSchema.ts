import { isValidObjectId } from 'mongoose';
import * as yup from 'yup';
import categories from './categories';
import { parseISO } from 'date-fns';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
yup.addMethod(yup.string, 'email', function (message) {
  return this.matches(emailRegex, {
    message: message || 'Invalid email format',
    name: 'email',
    excludeEmptyString: true,
  });
});
const password = {
  password: yup
    .string()
    .required("Password is missing")
    .min(8, "Password should be at least 8 chars long")
    .matches(passwordRegex, "Password is too simple")
}
export const newUserSchema = yup.object({
  name: yup.string().required("Name is missing"),
  email: yup.string().email("Invalid email!").required("Email is missing"),
  ...password
})
const tokenAndId = {
  id: yup.string().test({
    name: "valid-id",
    message: "Invalid user id",
    test: (value) => {
      return isValidObjectId(value)
    },
  }),
  token: yup.string().required("Token is missing"),
  // password: yup
  // .string()
  // .required("Password is missing")
  // .min(8,"Password should be at least 8 chars long")
  // .matches(passwordRegex, "Password is too simple")
}
export const verifyTokenSchema = yup.object({
  ...tokenAndId,
  // ...password,
});


export const restPassSchema = yup.object({
  ...tokenAndId,
  ...password,

});

export const newProductSchema = yup.object({
  name: yup.string().required('Name is missing'),
  description: yup.string().required('Description is missing'),
  category: yup.string().oneOf(categories, "Invalid Category").required('Category is missing'),
  price: yup
    .string()
    .transform((value) => {
      if (isNaN(+value)) return ""
      return +value
    }).required('Price is missing!'),
  //  quantity: yup.number().required('Quantity is missing'),

  //  purchasingDate: yup.string()
  //  .matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
  //  .required('Purchasing date is missing!'),

  purchasingDate: yup.string()
    .transform((value) => {
      try {
        // const valid = parseISO(value)
        return  parseISO(value);
      } catch (error) {
        return "";
      }

    })
    .required('Purchasing date is missing!'),
});