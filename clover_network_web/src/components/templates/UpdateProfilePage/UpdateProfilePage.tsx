import { ChangeEvent, Fragment, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import { FaCamera, FaRegEye, FaRegEyeSlash } from 'react-icons/fa'
import 'react-toastify/dist/ReactToastify.css'
import { AiFillCalendar } from 'react-icons/ai'

import images from '@/assets/images'
import {
  useChangePassword,
  useGetFetchQuery,
  usePostUpdateProfile,
} from '@/hook'

import Button from '@/components/atoms/Button'
import Footer from '@/components/organisms/Footer'
import CropImage from '@/components/molecules/CropImage'
import { useQueryClient } from '@tanstack/react-query'
import { BiLoaderAlt } from 'react-icons/bi'

const imageMimeType = /image\/(png|jpg|jpeg)/i

const UpdateProfilePage = () => {
  const queryClient = useQueryClient()

  const updateProfileApi = usePostUpdateProfile()

  const getUserInfo = useGetFetchQuery<ResponseUserType>(['UserInfo'])

  const changePassApi = useChangePassword()

  const [eye, setEye] = useState<boolean>(false)
  const [info, setInfo] = useState<boolean>(true)
  const [cropImage, setCropImage] = useState<string | ArrayBuffer | null>(null)
  const [modalCrop, setModalCrop] = useState(false)
  const [previewImg, setPreviewImg] = useState<string>(
    getUserInfo?.data.avatar || '',
  )
  const [file, setFile] = useState<File>()

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(previewImg)
    }
  }, [previewImg])

  useEffect(() => {
    let reader: FileReader,
      isCancel: boolean = false
    if (file) {
      reader = new FileReader()
      reader.onload = (e: any) => {
        const { result } = e.target
        if (result && !isCancel) {
          setCropImage(result)
          setModalCrop(true)
        }
      }
      reader.readAsDataURL(file)
    }
    return () => {
      isCancel = true
      if (reader && reader.readyState === 2) {
        reader.abort()
        reader.onload = null
      }
    }
  }, [file])

  const handleCrop = (e: ChangeEvent<HTMLInputElement>) => {
    let input = e.currentTarget
    if (input.files?.length) {
      const file = input.files[0]
      if (!file.type.match(imageMimeType)) {
        toast.error('Please choose the correct image format!')
        return
      }
      setFile(file)
    }
    e.currentTarget.value = ''
  }

  const formatDate = () => {
    let dateString = getUserInfo?.data.dayOfBirth
    let [day, month, year] = dateString!.split('/')

    const date = getUserInfo?.data.dayOfBirth
      ? new Date(+year, +month - 1, +day)
      : new Date()
    const timeZoneOffset = date.getTimezoneOffset()

    date.setDate(date.getDate())

    date.setMinutes(date.getMinutes() - timeZoneOffset)

    return date
  }

  const [startDate, setStartDate] = useState(formatDate())

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateInfoType>({
    defaultValues: {
      firstname: getUserInfo?.data.firstname,
      lastname: getUserInfo?.data.lastname,
      phoneNo: getUserInfo?.data.phoneNo || '',
      dayOfBirth: getUserInfo?.data.dayOfBirth,
      gender: getUserInfo?.data.gender,
    },
  })

  const changePassForm = useForm<ChangePasswordType>({
    defaultValues: {
      email: '',
      oldPassword: '',
      newPassword: '',
      repeatNewPassword: '',
    },
  })

  const handleSetDate = (date: Date) => {
    if (date < new Date()) {
      setStartDate(date)
    } else {
      toast.warning('Please choose the correct date of birth!')
    }
  }

  const handleUpdateInfo = (data: UpdateInfoType) => {
    data.dayOfBirth = startDate.toLocaleDateString()
    updateProfileApi.mutate(data, {
      onSuccess() {
        toast.success('Updated account information successfully!')
        queryClient.invalidateQueries({ queryKey: ['UserInfo'] })
      },
      onError() {
        toast.success('Update information failed, please check again!')
      },
    })
  }

  const handleChangePassword = (value: ChangePasswordType) => {
    changePassApi.mutate(value, {
      onSuccess(data) {
        if (data.data.messageEN === 'Invalid password') {
          toast.error('Invalid password!')
        } else {
          toast.success('Password changed successfully!')
          changePassForm.reset()
        }
      },
    })
  }

  return (
    <Fragment>
      <section className='mt-[77px] bg-bgPrimaryColor'>
        <div className='mx-6 mb-[32px] max-w-screen-xl rounded-xl bg-white px-5 py-6 shadow-md lg:mx-auto'>
          <div className='relative mx-auto mt-8 w-60'>
            <figure className='h-60 w-60'>
              <img
                src={previewImg || getUserInfo?.data.avatar || images.avatar}
                className='h-full w-full rounded-full border'
                alt='avatar'
              />
            </figure>
            <label
              htmlFor='dropZone'
              className='absolute bottom-2 right-3 cursor-pointer rounded-full border-4 border-white bg-bgPrimaryColor p-4 text-xl'
            >
              <FaCamera />
            </label>
            <input
              id='dropZone'
              type='file'
              onChange={handleCrop}
              hidden
              accept='image/*'
            />
          </div>
          <h1 className='mt-5 text-center text-2xl text-primaryColor'>
            {getUserInfo?.data.firstname} {getUserInfo?.data.lastname}
          </h1>
          <div className='mt-8'>
            <ul className='flex items-center'>
              <li
                className='me-2 inline-flex cursor-pointer items-center justify-center rounded border border-primaryColor bg-primaryColor/5 p-3 text-sm font-medium text-primaryColor hover:bg-primaryColor/30'
                onClick={() => setInfo(true)}
              >
                Update info
              </li>
              <li
                className='me-2 inline-flex cursor-pointer items-center justify-center rounded border border-primaryColor bg-primaryColor/5 p-3 text-sm font-medium text-primaryColor hover:bg-primaryColor/30'
                onClick={() => setInfo(false)}
              >
                Change password
              </li>
            </ul>
            {info && (
              <form className='my-8'>
                <div className='mb-5 flex gap-5'>
                  <div className='w-full'>
                    <input
                      type='text'
                      id='firstname'
                      {...register('firstname', {
                        required: {
                          value: true,
                          message: 'Please enter a firstname!',
                        },
                        minLength: {
                          value: 2,
                          message: 'Please enter a minimum of 2 characters!',
                        },
                      })}
                      className={`w-full rounded-lg border border-thirdColor px-3 py-4 outline-none ${
                        errors.firstname
                          ? 'border-warnColor bg-red-50 placeholder-lightWarnColor'
                          : 'bg-white'
                      }`}
                      placeholder='First Name'
                    />
                    <p className='mt-2 text-sm text-warnColor'>
                      {errors.firstname?.message}
                    </p>
                  </div>
                  <div className='w-full'>
                    <input
                      type='text'
                      id='lastname'
                      {...register('lastname', {
                        required: {
                          value: true,
                          message: 'Please enter a lastname!',
                        },
                        minLength: {
                          value: 2,
                          message: 'Please enter a minimum of 2 characters!',
                        },
                      })}
                      className={`w-full rounded-lg border border-thirdColor px-3 py-4 outline-none ${
                        errors.lastname
                          ? 'border-warnColor bg-red-50 placeholder-lightWarnColor'
                          : 'bg-white'
                      }`}
                      placeholder='Last Name'
                    />
                    <p className='mt-2 text-sm text-warnColor'>
                      {errors.lastname?.message}
                    </p>
                  </div>
                </div>
                <div className='mb-5'>
                  <input
                    type='text'
                    id='phoneNo'
                    {...register('phoneNo', {
                      pattern: {
                        value:
                          /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
                        message:
                          'Please enter the correct phone number format!',
                      },
                    })}
                    className={`w-full rounded-lg border border-thirdColor px-3 py-4 outline-none ${
                      errors.phoneNo
                        ? 'border-warnColor bg-red-50 placeholder-lightWarnColor'
                        : 'bg-white'
                    }`}
                    placeholder='Phone Number'
                  />
                  <p className='mt-2 text-sm text-warnColor'>
                    {errors.phoneNo?.message}
                  </p>
                </div>
                <div className='mb-16 block items-center gap-5 2xl:flex'>
                  <div className='relative mb-5 w-full 2xl:mb-0'>
                    <label htmlFor='datePicker'>
                      <p className='mb-2'>Date of birth</p>
                      <DatePicker
                        id='datePicker'
                        className={`h-[57.8px] w-full rounded-lg border border-thirdColor text-sm text-gray-500 outline-none`}
                        wrapperClassName='w-full'
                        dayClassName={(date) => {
                          return startDate &&
                            date.toDateString() === startDate.toDateString()
                            ? '!bg-primaryColor'
                            : 'bg-primaryColor/10'
                        }}
                        onKeyDown={(e) => e.preventDefault()}
                        selected={startDate}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode='select'
                        onChange={(date: Date) => handleSetDate(date)}
                        showIcon
                        icon={
                          <AiFillCalendar className='right-0 top-1/2 -translate-y-1/2  text-2xl text-primaryColor' />
                        }
                      />
                    </label>
                  </div>
                  <div className='w-full'>
                    <p className='mb-2'>Gender</p>
                    <div
                      className={`flex items-center justify-center gap-4 rounded-lg border border-secondColor px-2 py-4 ${
                        errors.gender
                          ? 'border-warnColor bg-red-50 placeholder-lightWarnColor'
                          : 'bg-white'
                      }`}
                    >
                      <label htmlFor='male' className='flex items-center gap-3'>
                        <input
                          type='radio'
                          id='male'
                          {...register('gender', {
                            required: true,
                          })}
                          value='MALE'
                          className="visible after:relative after:left-[-2px] after:top-[-4px] after:inline-block after:h-4 after:w-4 after:cursor-pointer after:rounded-full  after:bg-[#d1d3d1] after:content-['']
                            checked:after:visible checked:after:relative checked:after:left-[-2px] checked:after:top-[-4px] checked:after:inline-block checked:after:h-4 checked:after:w-4 checked:after:cursor-pointer checked:after:rounded-full checked:after:bg-green-500 checked:after:content-['']"
                        />
                        <p
                          className={`text-sm ${
                            errors.gender ? 'text-warnColor' : 'text-gray-500'
                          }`}
                        >
                          Male
                        </p>
                      </label>
                      <span className='h-6 w-px bg-secondColor'></span>
                      <label
                        htmlFor='female'
                        className='flex items-center gap-3'
                      >
                        <input
                          type='radio'
                          id='female'
                          {...register('gender', {
                            required: true,
                          })}
                          value='FEMALE'
                          className="visible after:relative after:left-[-2px] after:top-[-4px] after:inline-block after:h-4 after:w-4 after:cursor-pointer after:rounded-full  after:bg-[#d1d3d1] after:content-['']
                            checked:after:visible checked:after:relative checked:after:left-[-2px] checked:after:top-[-4px] checked:after:inline-block checked:after:h-4 checked:after:w-4 checked:after:cursor-pointer checked:after:rounded-full checked:after:bg-green-500 checked:after:content-['']"
                        />
                        <p
                          className={`text-sm ${
                            errors.gender ? 'text-warnColor' : 'text-gray-500'
                          }`}
                        >
                          Female
                        </p>
                      </label>
                      <span className='h-6 w-px bg-secondColor'></span>
                      <label
                        htmlFor='other'
                        className='flex items-center gap-3'
                      >
                        <input
                          type='radio'
                          id='other'
                          {...register('gender', {
                            required: true,
                          })}
                          value='OTHER'
                          className="visible after:relative after:left-[-2px] after:top-[-4px] after:inline-block after:h-4 after:w-4 after:cursor-pointer after:rounded-full  after:bg-[#d1d3d1] after:content-['']
                            checked:after:visible checked:after:relative checked:after:left-[-2px] checked:after:top-[-4px] checked:after:inline-block checked:after:h-4 checked:after:w-4 checked:after:cursor-pointer checked:after:rounded-full checked:after:bg-green-500 checked:after:content-['']"
                        />
                        <p
                          className={`text-sm ${
                            errors.gender ? 'text-warnColor' : 'text-gray-500'
                          }`}
                        >
                          Other
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
                <Button
                  className='flex h-[58px] w-full items-center justify-center rounded-lg bg-primaryColor px-3 py-4 font-semibold text-white shadow-formButton hover:opacity-80'
                  onClick={handleSubmit(handleUpdateInfo)}
                >
                  {updateProfileApi.isPending ? (
                    <BiLoaderAlt className='animate-spin text-3xl' />
                  ) : (
                    'Update'
                  )}
                </Button>
              </form>
            )}
            {!info && (
              <form className='my-8'>
                <div className='mb-5 flex gap-5'>
                  <div className='w-full'>
                    <input
                      type='text'
                      id='email'
                      {...changePassForm.register('email', {
                        required: {
                          value: true,
                          message: 'Please enter email!',
                        },
                        pattern: {
                          value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
                          message: 'Please enter the correct email format!',
                        },
                      })}
                      className={`w-full rounded-lg border border-thirdColor px-3 py-4 outline-none ${
                        changePassForm.formState.errors.email
                          ? 'border-warnColor bg-red-50 placeholder-lightWarnColor'
                          : 'bg-white'
                      }`}
                      placeholder='Email'
                    />
                    <p className='mt-2 text-sm text-warnColor'>
                      {changePassForm.formState.errors.email?.message}
                    </p>
                  </div>
                </div>
                <div className='mb-5 flex gap-5'>
                  <div className='w-full'>
                    <div
                      className={`flex items-center gap-1 rounded-lg border border-thirdColor px-3 outline-none ${
                        changePassForm.formState.errors.oldPassword
                          ? 'border-warnColor bg-red-50 placeholder-lightWarnColor'
                          : 'bg-white'
                      }`}
                    >
                      <input
                        type={eye ? 'text' : 'password'}
                        {...changePassForm.register('oldPassword', {
                          required: {
                            value: true,
                            message: 'Please enter password!',
                          },
                        })}
                        autoComplete='on'
                        className={`h-full flex-1 bg-transparent py-4 outline-none ${
                          changePassForm.formState.errors.oldPassword &&
                          'placeholder-lightWarnColor'
                        }`}
                        placeholder='Old Password'
                      />
                      <span className='cursor-pointer'>
                        {!eye ? (
                          <FaRegEye onClick={() => setEye(true)} />
                        ) : (
                          <FaRegEyeSlash onClick={() => setEye(false)} />
                        )}
                      </span>
                    </div>
                    <p className='mt-2 text-sm text-warnColor'>
                      {changePassForm.formState.errors.oldPassword?.message}
                    </p>
                  </div>
                </div>
                <div className='mb-5 flex gap-5'>
                  <div className='w-full'>
                    <div
                      className={`flex items-center gap-1 rounded-lg border border-thirdColor px-3 outline-none ${
                        changePassForm.formState.errors.newPassword
                          ? 'border-warnColor bg-red-50 placeholder-lightWarnColor'
                          : 'bg-white'
                      }`}
                    >
                      <input
                        type={eye ? 'text' : 'password'}
                        {...changePassForm.register('newPassword', {
                          required: {
                            value: true,
                            message: 'Please enter password!',
                          },
                        })}
                        autoComplete='on'
                        className={`h-full flex-1 bg-transparent py-4 outline-none ${
                          changePassForm.formState.errors.newPassword &&
                          'placeholder-lightWarnColor'
                        }`}
                        placeholder='New Password'
                      />
                      <span className='cursor-pointer'>
                        {!eye ? (
                          <FaRegEye onClick={() => setEye(true)} />
                        ) : (
                          <FaRegEyeSlash onClick={() => setEye(false)} />
                        )}
                      </span>
                    </div>
                    <p className='mt-2 text-sm text-warnColor'>
                      {changePassForm.formState.errors.newPassword?.message}
                    </p>
                  </div>
                </div>
                <div className='mb-5 flex gap-5'>
                  <div className='w-full'>
                    <div
                      className={`flex items-center gap-1 rounded-lg border border-thirdColor px-3 outline-none ${
                        changePassForm.formState.errors.repeatNewPassword
                          ? 'border-warnColor bg-red-50 placeholder-lightWarnColor'
                          : 'bg-white'
                      }`}
                    >
                      <input
                        type={eye ? 'text' : 'password'}
                        {...changePassForm.register('repeatNewPassword', {
                          required: {
                            value: true,
                            message: 'Please enter password!',
                          },
                        })}
                        autoComplete='on'
                        className={`h-full flex-1 bg-transparent py-4 outline-none ${
                          changePassForm.formState.errors.repeatNewPassword &&
                          'placeholder-lightWarnColor'
                        }`}
                        placeholder='Confirm New Password'
                      />
                      <span className='cursor-pointer'>
                        {!eye ? (
                          <FaRegEye onClick={() => setEye(true)} />
                        ) : (
                          <FaRegEyeSlash onClick={() => setEye(false)} />
                        )}
                      </span>
                    </div>
                    <p className='mt-2 text-sm text-warnColor'>
                      {
                        changePassForm.formState.errors.repeatNewPassword
                          ?.message
                      }
                    </p>
                  </div>
                </div>

                <Button
                  onClick={changePassForm.handleSubmit(handleChangePassword)}
                  className='flex h-[58px] w-full items-center justify-center rounded-lg bg-primaryColor px-3 py-4 font-semibold text-white shadow-formButton hover:opacity-80'
                >
                  {changePassApi.isPending ? (
                    <BiLoaderAlt className='animate-spin text-3xl' />
                  ) : (
                    'Update'
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
      <Footer />
      {modalCrop && (
        <CropImage
          image={cropImage}
          setModalCrop={setModalCrop}
          setPreviewImg={setPreviewImg}
        />
      )}
    </Fragment>
  )
}

export default UpdateProfilePage
