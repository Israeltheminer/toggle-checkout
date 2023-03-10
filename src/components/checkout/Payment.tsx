import React, { useEffect, useState } from "react"
import Image from 'next/image'
import { useDispatch, useSelector } from "react-redux"
import cardValidator from "card-validator"
import { Current } from "@/components/checkout/StatusBar"
import { getCards, addCardToVault, addCardToCart } from "@/services/cardService"
import CustomerInfo from "./CustomerInfo"
import swell from "swell-js"

import { RootState } from '@/store/reducers'
import { setCheckoutStage } from "@/store/reducers/checkoutSlice"
import { setAgreementToTerms, setBillingAddress, setCardDetails, setPaymentMethod } from "@/store/reducers/paymentSlice"

interface IValidInputs {
   number: { isPotentiallyValid: boolean, isValid: boolean }
   name: { isPotentiallyValid: boolean, isValid: boolean }
   code: { isPotentiallyValid: boolean, isValid: boolean }
   expiry: { isPotentiallyValid: boolean, isValid: boolean }
}

swell.init(
   process.env.NEXT_PUBLIC_SWELL_STORE as string,
   process.env.NEXT_PUBLIC_SWELL_API_TOKEN as string
)

const Payment = () => {
   const dispatch = useDispatch()
   const { agreedToTerms, billingAddress, cardDetails, paymentMethod } = useSelector((state: RootState) => state.payment)
   const { results } = useSelector((state: RootState) => state.cards)
   const [validInputs, setValidInputs] = useState<IValidInputs>({
      number: { isPotentiallyValid: true, isValid: true },
      name: { isPotentiallyValid: true, isValid: true },
      code: { isPotentiallyValid: true, isValid: true },
      expiry: { isPotentiallyValid: true, isValid: true }
   })
   const [focusedElement, setFocusedElement] = useState("")
   const [agreedToTermsError, setAgreedToTermsError] = useState(false)
   const [saveCardOption, setSaveCardOption] = useState(false)
   const [previousCardOption, setPreviousCardOption] = useState("")
   const [paypalPaymentError, setPaypalPaymentError] = useState(false)
   const postNewCard = async () => {
      dispatch(addCardToVault())
      dispatch(addCardToCart())
   }

   const handleCardInputError = (name: keyof IValidInputs) => {
      return {
         borderColor: (focusedElement === name && !(validInputs[name].isPotentiallyValid)) || ((focusedElement !== name && !validInputs[name].isValid)) ? "#df4545" : validInputs[name].isValid ? "#ced4da" : "#ced4da"
      }
   }

   const validateCardInputs = () => {
      const validationResponse = Object.values(validInputs).some((innerObj) => {
         return Object.values(innerObj).some((value) => value === false)
      })
      return validationResponse
   }
   const handleCardDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const name = e.target.name
      const rawValue = e.target.value
      if (name === "name") {
         const formattedValue = rawValue.replace(/\b[a-z]/g, (letter: string) => letter.toUpperCase())
         const { isPotentiallyValid, isValid } = cardValidator.cardholderName(formattedValue)
         dispatch(setCardDetails({ type: name, value: formattedValue }))
         setValidInputs(prev => ({ ...prev, name: { isPotentiallyValid, isValid } }))
      } else if (name === "number") {
         const formattedValue = rawValue.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim()
         const { isPotentiallyValid, isValid } = cardValidator.number(formattedValue)
         dispatch(setCardDetails({ type: name, value: formattedValue }))
         setValidInputs(prev => ({ ...prev, number: { isPotentiallyValid, isValid } }))
      } else if (name === "code") {
         const formattedValue = rawValue.replace(/\D/g, '').substring(0, 4)
         const { isPotentiallyValid, isValid } = cardValidator.cvv(formattedValue)
         dispatch(setCardDetails({ type: name, value: formattedValue }))
         setValidInputs(prev => ({ ...prev, code: { isPotentiallyValid, isValid } }))
      } else if (name === "expiry") {
         const formattedValue = rawValue.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2').trim()
         const { isPotentiallyValid, isValid } = cardValidator.expirationDate(formattedValue)
         dispatch(setCardDetails({ type: name, value: formattedValue }))
         setValidInputs(prev => ({ ...prev, expiry: { isPotentiallyValid, isValid } }))
      }
   }
   useEffect(() => {
      const handleFocus = () => {
         // Clear the focused element state when no element is in focus
         setFocusedElement((document.activeElement as HTMLInputElement).name)
      }
      async function getAllCards () {
         await dispatch(getCards())
      }
      getAllCards()
      const handleBlur = () => {
         // Clear the focused element state when no element is in focus
         setFocusedElement('')
      }
      document.addEventListener('focus', handleFocus, true)
      document.addEventListener('blur', handleBlur, true)
      return () => {
         document.removeEventListener('focus', handleFocus, true)
         document.removeEventListener('blur', handleBlur, true)
      }
   }, [])
   useEffect(() => {
      agreedToTerms && setAgreedToTermsError(() => false)
   }, [agreedToTerms])
   const [hasCalled, setHasCalled] = useState(false)

   useEffect(() => {
      if (!hasCalled) {
         swell.payment.createElements({
            paypal: {
               elementId: '#paypal-button',
               style: {
                  layout: 'vertical',
                  color: 'blue',
                  shape: 'rect',
                  label: 'buynow',
                  tagline: false,
               },
               onSuccess: async () => {
                  await swell.cart.submitOrder()
                  dispatch(setCheckoutStage("thanks"))
               },
               onError: (error: any) => {
                  setPaypalPaymentError(() => true)
                  // console.error(error.message)
               },
            },
         })
         setHasCalled(() => true)
      }
   }, [])
   return (
      <div className='flex flex-col gap-10' data-cy="Payment">
         <CustomerInfo />
         <div className="flex flex-col gap-6">
            <div className='flex gap-4 items-center'>
               <div className="scale-125">
                  <Current name="" position="" />
               </div>
               <h1 className='font-bold text-xl text-[#8f7134]'>Payment Method</h1>
            </div>
            <div className="border border-[#ced4da] rounded-sm px-7 py-3 flex items-center gap-8">
               <p className="text-base font-semibold">All transactions are secure and encrypted</p>
            </div>
            <div>
               <div className="border border-[#ced4da] divide-y divide-[#ced4da] rounded-sm flex flex-col">
                  <div className="divide-y">
                     <div className="flex justify-between items-center h-[60px] px-7">
                        <span className="flex items-center gap-7">
                           <input type="radio" className="dark-radio-input" name="paymentMethod" value="creditCard" checked={ paymentMethod === "creditCard" } onChange={ () => dispatch(setPaymentMethod("creditCard")) } />
                           <p className="text-base font-semibold">Credit card</p>
                        </span>
                        <span className="flex items-center gap-3">
                           <Image src="/assets/images/MasterCard.svg" alt="van" style={ { height: "auto" } } width={ 40 } height={ 44 } />
                           <Image src="/assets/images/visa.svg" alt="van" style={ { height: "auto" } } width={ 48 } height={ 44 } />
                           <Image src="/assets/images/amex.svg" alt="van" style={ { height: "auto" } } width={ 40 } height={ 44 } />
                        </span>
                     </div>
                     { (paymentMethod === "creditCard" && !previousCardOption) &&
                        <div className="flex flex-col gap-5 px-7 py-4">
                           <input type="text" name="number" pattern="[0-9 ]{4} [0-9 ]{4} [0-9 ]{4} [0-9 ]{4}" id="cardNumber" className="base-input" placeholder="Credit card number" onChange={ handleCardDetailChange } value={ cardDetails.number } style={ handleCardInputError("number") } />
                           <input type="text" name="name" id="cardName" className="base-input" placeholder="Name on Card" onChange={ handleCardDetailChange } value={ cardDetails.name } style={ handleCardInputError("name") } />
                           <div className="flex gap-4 justify-between">
                              <input type="text" name="expiry" id="expiry" className="base-input w-full" placeholder="MM /YY" onChange={ handleCardDetailChange } value={ cardDetails.expiry } style={ handleCardInputError("expiry") } />
                              <input type="text" name="code" id="code" className="base-input w-full" placeholder="Security code" onChange={ handleCardDetailChange } value={ cardDetails.code } style={ handleCardInputError("code") } />
                           </div>
                           <label htmlFor="saveCard" className="self-start text-[15px] font-semibold" >
                              <input type="checkbox" name="saveCard" id="saveCard" className="mr-2" onChange={ (e) => setSaveCardOption(() => e.target.checked) } checked={ saveCardOption } />
                              Add Card to vault
                           </label>
                        </div>
                     }
                     { (paymentMethod === "creditCard") &&
                        <div className="flex flex-col px-7 divide-y">
                           {
                              results?.map(({ token, brand, last4, exp_month, exp_year }: { token: string; brand: string; last4: string; exp_month: number; exp_year: number }, key: string) => (
                                 <div className="flex justify-start items-center gap-6 font-semibold text-sm py-3" key={ key }>
                                    <input type="radio" name="previousCardOption" value={ token } checked={ previousCardOption === token } onClick={ (e) => {
                                       e.currentTarget.value === previousCardOption && setPreviousCardOption("")
                                    } } onChange={ (e) => {
                                       setPreviousCardOption(() => e.target.value)
                                    } } />
                                    <p>XXXX XXXX XXXX XXXX { last4 }</p>
                                    <p>{ exp_month } / { exp_year }</p>
                                    <p>{ brand }</p>
                                 </div>
                              )) }
                        </div>
                     }
                  </div>
                  <div className="flex items-center gap-7 h-[60px] px-7">
                     <input type="radio" className="dark-radio-input" name="paymentMethod" value="paypal" checked={ paymentMethod === "paypal" } onChange={ () => dispatch(setPaymentMethod("paypal")) } />
                     <Image src="/assets/images/PayPal.svg" alt="van" style={ { height: "auto" } } width={ 80 } height={ 44 } />
                  </div>
                  <div style={ { height: paymentMethod === "paypal" ? "192px" : "0", overflow: "hidden", padding: paymentMethod === "paypal" ? "28px 28px 0" : "0", marginBottom: paymentMethod === "paypal" ? "28px" : "0" } }>
                     {
                        <div id="paypal-button" ></div>
                     }
                  </div>
                  <div className="flex justify-between items-center h-[60px] px-7">
                     <span className="flex items-center gap-7">
                        <input type="radio" className="dark-radio-input" name="paymentMethod" value="bankTransfer" checked={ paymentMethod === "bankTransfer" } onChange={ () => dispatch(setPaymentMethod("bankTransfer")) } />
                        <p className="text-base font-semibold">Bank transfer</p>
                     </span>
                     <span>
                        <p className="text-base text-white rounded-2xl bg-green-500 px-4">Save 7%</p>
                     </span>
                  </div>
               </div>
            </div>
            <span style={ { borderWidth: "1px", borderColor: agreedToTermsError ? "#df4545" : "#fff" } }>
               <input className='base-checkbox' type="checkbox" name="paymentConfirmation" checked={ agreedToTerms } onChange={ () => dispatch(setAgreementToTerms()) } />
               <label htmlFor="paymentConfirmation" className='text-sm ml-2'>
                  By clicking "Confirmation Payment", I agree to the companies term of services. { agreedToTermsError && <Image className="inline" src="/assets/images/alert.svg" width={ 26 } height={ 26 } alt="alert" /> }
               </label>
            </span>
            <div className="flex flex-col gap-4 mt-3">
               <h1 className='font-bold text-xl text-[#262523]'>Billing Address</h1>
               <div className="w-full text-base flex flex-col font-semibold border border-[#ced4da] divide-y divide-[#ced4da]">
                  <span className="py-4 px-7 flex items-center gap-6">
                     <input type="radio" className="dark-radio-input" name="billingAddress" value="shipping" onChange={ () => dispatch(setBillingAddress("shipping")) } checked={ billingAddress === "shipping" } />
                     <span>Same as shipping address</span>
                  </span>
                  <span className="py-4 px-7 flex items-center gap-6">
                     <input type="radio" className="dark-radio-input" name="billingAddress" value="other" onChange={ () => dispatch(setBillingAddress("other")) } checked={ billingAddress === "other" } />
                     <span>Use a different billing address</span>
                  </span>
               </div>
            </div>
         </div>
         <div className='flex items-center justify-between'>
            <span className='font-bold text-lg text-[#BDA25C] cursor-pointer' onClick={ () => dispatch(setCheckoutStage("shipping")) }>Back</span>
            <button className='bg-[#BDA25C] min-w-[260px] py-3 px-9 rounded-sm text-white font-bold text-lg' onClick={ () => {
               if (agreedToTerms) {
                  switch (paymentMethod) {
                     case "creditCard":
                        // !validateCardInputs() && dispatch("thanks"))
                        if (!validateCardInputs()) {
                           saveCardOption && postNewCard()
                        }
                        break
                     case "paypal":
                        dispatch(setCheckoutStage("thanks"))
                        break
                     case "bankTransfer":
                        dispatch(setCheckoutStage("thanks"))
                        break
                     default:
                        break
                  }
               } else {
                  setAgreedToTermsError(() => true)
               }
            } } name="complete-order">Complete order</button>
         </div>
      </div>
   )
}

export default Payment