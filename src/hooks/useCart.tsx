import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
       return JSON.parse(storagedCart);
    }

    return [];
  });    

  const addProduct = async (productId: number) => {
    try {

      const productResult: Product = await api.get(`products/${productId}`)
             .then(response => response.data);      

      const { amount }: Stock = await api.get<Stock>(`stock/${productId}`)
                                         .then(response => response.data );

      if(amount < 1 ) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }    
      
      if(cart.length > 0){       
          
        const prod = cart.find(item => item.id === productId);
        const productsInCart = cart.filter(item => item.id !== productId);          

        if(prod){
          if((prod.amount+1) > amount ) {
            toast.error('Quantidade solicitada fora de estoque');
            return;
          }

          const newObj = {...prod, amount: (prod.amount + 1)}
          const newArray = [...productsInCart, {...newObj}];
          setCart(newArray);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newArray));
        }else {
          const newArray = [...productsInCart, {...productResult, amount: 1}];
          setCart(newArray);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newArray));
        }  
        
      }else {       
        const newArray = [{...productResult, amount: 1}];
        setCart(newArray);                
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newArray));        
      }  

    } catch {
      toast.error('Erro na adição do produto');
      toast.error('Quantidade solicitada fora de estoque');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find(item => item.id === productId);

      if(product) {  
        const productIndex = cart.findIndex(item => productId === item.id);
        
        cart.splice(productIndex,1);
  
        setCart([...cart]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]));
        
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      
      const qtyAmount: UpdateProductAmount = await 
      api.get(`stock/${productId}`)
         .then(response => response.data);      

      if((amount < 1) || (amount > qtyAmount.amount) || (qtyAmount.amount < 1)) {
        toast.error('Quantidade solicitada fora de estoque');
        throw new Error();
      }

      const product = cart.find(item => item.id === productId);
      const productsInCart = cart.filter(item => item.id !== productId);  

      if(product){
        const newObj = {...product, amount}
        const newArray = [...productsInCart, {...newObj}];
        setCart(newArray);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newArray));
      }else {        
        toast.error('Quantidade solicitada fora de estoque');
      }      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');      
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
