import Loginform from '@/components/Loginform'
import Image from 'next/image'


const Login = () => {
  return (
    <main className='flex min-h-screen w-full flex-col lg:flex-row'>
        {/* Test-tube login image */}
        <div className='flex min-h-[320px] flex-1 items-center justify-center bg-[linear-gradient(180deg,#F7FAFF_0%,#EEF5FF_100%)] px-6 py-10 lg:min-h-screen'>
            <div className='max-w-[520px]'>
              <Image src="/login-image.png" alt="test-tube-man" height={344} width={467} priority />
            </div>
        </div>

        {/* Login form */}
        <div className='flex flex-1 items-center justify-center bg-white px-6 py-10 sm:px-8 lg:px-10'>
            <Loginform />
        </div>
    </main>
  )
}

export default Login
