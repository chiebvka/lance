import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react'

type Props = {}

export default  async function ProtectedLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return redirect("/login");
    }

  return (
    <div  className='w-full h-full'>
        <div className='w-full h-full'>
            <div className='w-full h-full'>
                {children}
            </div>
        </div>
    </div>
  )
}