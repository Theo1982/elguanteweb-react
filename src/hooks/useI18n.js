import { createContext, useContext, useState, useEffect } from 'react';

// Context for internationalization
const I18nContext = createContext();

// Available languages
const languages = {
  es: {
    code: 'es',
    name: 'Español',
    flag: '🇪🇸'
  },
  en: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸'
  },
  pt: {
    code: 'pt',
    name: 'Português',
    flag: '🇧🇷'
  }
};

// Translation dictionaries
const translations = {
  es: {
    // Navigation
    home: 'Inicio',
    shop: 'Tienda',
    cart: 'Carrito',
    login: 'Ingresar',
    logout: 'Cerrar sesión',
    profile: 'Mi Perfil',
    orders: 'Mis Pedidos',
    favorites: 'Favoritos',
    referrals: 'Referidos',
    coupons: 'Cupones',
    admin: 'Administración',

    // Common
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Agregar',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    price: 'Precio',
    quantity: 'Cantidad',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Impuestos',
    shipping: 'Envío',
    discount: 'Descuento',

    // Product
    product: 'Producto',
    products: 'Productos',
    addToCart: 'Agregar al carrito',
    buyNow: 'Comprar ahora',
    outOfStock: 'Sin stock',
    inStock: 'En stock',
    reviews: 'Reseñas',
    description: 'Descripción',
    specifications: 'Especificaciones',
    relatedProducts: 'Productos relacionados',

    // Cart
    emptyCart: 'Tu carrito está vacío',
    checkout: 'Finalizar compra',
    continueShopping: 'Continuar comprando',

    // Auth
    email: 'Email',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    signIn: 'Iniciar sesión',
    signUp: 'Registrarse',
    forgotPassword: '¿Olvidaste tu contraseña?',
    resetPassword: 'Restablecer contraseña',

    // Newsletter
    newsletterTitle: 'Suscríbete a nuestro Newsletter',
    newsletterDescription: 'Recibe ofertas exclusivas, nuevos productos y consejos de limpieza',
    subscribe: 'Suscribirse',
    emailPlaceholder: 'Ingresa tu email',

    // Footer
    aboutUs: 'Sobre nosotros',
    contact: 'Contacto',
    privacy: 'Privacidad',
    terms: 'Términos y condiciones',
    followUs: 'Síguenos',

    // Messages
    welcome: '¡Bienvenido!',
    thankYou: '¡Gracias!',
    orderSuccess: 'Pedido realizado con éxito',
    orderError: 'Error al procesar el pedido'
  },

  en: {
    // Navigation
    home: 'Home',
    shop: 'Shop',
    cart: 'Cart',
    login: 'Login',
    logout: 'Logout',
    profile: 'My Profile',
    orders: 'My Orders',
    favorites: 'Favorites',
    referrals: 'Referrals',
    coupons: 'Coupons',
    admin: 'Administration',

    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    price: 'Price',
    quantity: 'Quantity',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Tax',
    shipping: 'Shipping',
    discount: 'Discount',

    // Product
    product: 'Product',
    products: 'Products',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    outOfStock: 'Out of Stock',
    inStock: 'In Stock',
    reviews: 'Reviews',
    description: 'Description',
    specifications: 'Specifications',
    relatedProducts: 'Related Products',

    // Cart
    emptyCart: 'Your cart is empty',
    checkout: 'Checkout',
    continueShopping: 'Continue Shopping',

    // Auth
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    forgotPassword: 'Forgot your password?',
    resetPassword: 'Reset Password',

    // Newsletter
    newsletterTitle: 'Subscribe to our Newsletter',
    newsletterDescription: 'Receive exclusive offers, new products and cleaning tips',
    subscribe: 'Subscribe',
    emailPlaceholder: 'Enter your email',

    // Footer
    aboutUs: 'About Us',
    contact: 'Contact',
    privacy: 'Privacy',
    terms: 'Terms and Conditions',
    followUs: 'Follow Us',

    // Messages
    welcome: 'Welcome!',
    thankYou: 'Thank you!',
    orderSuccess: 'Order placed successfully',
    orderError: 'Error processing order'
  },

  pt: {
    // Navigation
    home: 'Início',
    shop: 'Loja',
    cart: 'Carrinho',
    login: 'Entrar',
    logout: 'Sair',
    profile: 'Meu Perfil',
    orders: 'Meus Pedidos',
    favorites: 'Favoritos',
    referrals: 'Indicações',
    coupons: 'Cupons',
    admin: 'Administração',

    // Common
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    add: 'Adicionar',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    price: 'Preço',
    quantity: 'Quantidade',
    total: 'Total',
    subtotal: 'Subtotal',
    tax: 'Impostos',
    shipping: 'Frete',
    discount: 'Desconto',

    // Product
    product: 'Produto',
    products: 'Produtos',
    addToCart: 'Adicionar ao carrinho',
    buyNow: 'Comprar agora',
    outOfStock: 'Fora de estoque',
    inStock: 'Em estoque',
    reviews: 'Avaliações',
    description: 'Descrição',
    specifications: 'Especificações',
    relatedProducts: 'Produtos relacionados',

    // Cart
    emptyCart: 'Seu carrinho está vazio',
    checkout: 'Finalizar compra',
    continueShopping: 'Continuar comprando',

    // Auth
    email: 'Email',
    password: 'Senha',
    confirmPassword: 'Confirmar senha',
    signIn: 'Entrar',
    signUp: 'Cadastrar',
    forgotPassword: 'Esqueceu sua senha?',
    resetPassword: 'Redefinir senha',

    // Newsletter
    newsletterTitle: 'Assine nosso Newsletter',
    newsletterDescription: 'Receba ofertas exclusivas, novos produtos e dicas de limpeza',
    subscribe: 'Assinar',
    emailPlaceholder: 'Digite seu email',

    // Footer
    aboutUs: 'Sobre nós',
    contact: 'Contato',
    privacy: 'Privacidade',
    terms: 'Termos e condições',
    followUs: 'Siga-nos',

    // Messages
    welcome: 'Bem-vindo!',
    thankYou: 'Obrigado!',
    orderSuccess: 'Pedido realizado com sucesso',
    orderError: 'Erro ao processar pedido'
  }
};

// Hook to use translations
export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }

  const { language, t } = context;
  return { language, t };
};

// Provider component
export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState('es'); // Default to Spanish

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('elguante-language');
    if (savedLanguage && languages[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage when changed
  useEffect(() => {
    localStorage.setItem('elguante-language', language);
  }, [language]);

  // Translation function
  const t = (key, fallback) => {
    return translations[language]?.[key] || fallback || key;
  };

  // Change language
  const changeLanguage = (newLanguage) => {
    if (languages[newLanguage]) {
      setLanguage(newLanguage);
    }
  };

  const value = {
    language,
    languages,
    t,
    changeLanguage
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export default useTranslation;
