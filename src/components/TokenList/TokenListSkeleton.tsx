'use client'

export default function TokenListSkeleton() {
  return (
    <div className='w-full overflow-hidden'>
      <h3 className='text-lg font-medium mb-4'>Supported Tokens</h3>

      <div className='mb-4'>
        <div className='skeleton h-12 w-full'></div>
      </div>

      <div className='mb-4'>
        <div className='skeleton h-4 w-48'></div>
      </div>

      <div className='overflow-x-auto -mx-4 sm:mx-0'>
        <div className='pb-4'>
          <div className='skeleton h-12 w-full mb-2'></div>
          {[...Array(5)].map((_, index) => (
            <div key={index} className='skeleton h-16 w-full mb-2'></div>
          ))}
        </div>
      </div>
    </div>
  )
}
