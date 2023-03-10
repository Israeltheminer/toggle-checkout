import React, { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import Image from 'next/image'
import { Processed } from "@/components/checkout/StatusBar"
import { setEmail } from "@/store/reducers/shippingSlice"
import { RootState } from '@/store/reducers'
import { setCheckoutStage } from "@/store/reducers/checkoutSlice"

const CustomerInfo = () => {
   const dispatch = useDispatch()
   const { address, apartment, province, country, city } = useSelector((state: RootState) => state.customer.shippingInformation)
   const stage = useSelector((state: RootState) => state.checkout.stage)
   const { email } = useSelector((state: RootState) => state.account)
   const { contactInformation } = useSelector((state: RootState) => state.customer)
   const { orders } = useSelector((state: RootState) => state.shipping)
   const [focused, setFocused] = useState(false)
   return (
      <div className='flex flex-col gap-6'>
         <div className='flex gap-4 items-center mt-6'>
            <div className="scale-125">
               <Processed name="" position="" />
            </div>
            <h1 className='font-bold text-xl text-[#262523]'>Customer Information</h1>
         </div>
         <div className="text-base divide-y border rounded-sm">
            <div className="flex items-start justify-between px-5 py-4">
               <div className="flex items-start gap-5">
                  <p className="font-semibold w-20">Contact</p>
                  <div>
                     { focused ? (
                        <input
                           type="email"
                           name="email"
                           value={ email ? email : contactInformation.email }
                           onChange={ e => dispatch(setEmail(e.target.value)) }
                           onBlur={ () => setFocused(false) }
                           ref={ (input) => { focused && input?.focus() } }
                           style={ { border: 'none', outline: 'none' } }
                        />
                     ) : (
                        <div>{ email ? email : contactInformation.email }</div>
                     ) }
                  </div>
               </div>
               <span className="text-[#bda25c] cursor-pointer" onClick={ () => setFocused(true) }>Change</span>
            </div>
            <div className="flex items-start justify-between p-5">
               <span className="flex items-start gap-5">
                  <p className="font-semibold w-20">Shipping</p>
                  <p className="max-w-[425px]">{ `${apartment} ${address}${address && ','} ${city}${city && ','} ${province}${province && ','} ${country}` }</p>
               </span>
               <span className="text-[#bda25c] cursor-pointer" onClick={ () => dispatch(setCheckoutStage("customer")) }>Change</span>
            </div>
            { stage === "payment" &&
               <div className="flex items-center justify-between p-5">
                  <span className="flex items-center gap-5">
                     <p className="font-semibold w-20">Method</p>
                     <ul className="max-w-[200px] text-[15px]" style={ { margin: "0" } }>
                        {
                           orders?.map(({ id, shipping }) =>
                              <li key={ `${id}` }>
                                 <span className="text-capitalize">{
                                    shipping.split(' ')
                                       .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                       .join(' ') }</span> shipping
                              </li>
                           )
                        }
                     </ul>
                  </span>
                  <span className="text-[#bda25c] cursor-pointer" onClick={ () => dispatch(setCheckoutStage("shipping")) }>Change</span>
               </div>
            }
         </div>
         { (stage === "payment" && orders.length > 0) &&
            <div className="bg-[#f0e9e2] rounded-sm px-9 py-3 flex items-center gap-8">
               <Image src="/assets/images/delivery.svg" alt="van" style={ { width: "auto", height: "auto" } } width={ 58 } height={ 38 } />
               <p className="text-[14px] font-semibold">Please note your order has been split into { orders.length } deliveries</p>
            </div>
         }
      </div>
   )
}

export default CustomerInfo