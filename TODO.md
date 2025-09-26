# TODO: Fix Duplicated Product Cards and Make Chatbot Functional

## Steps to Complete:

1. **Update src/pages/Admin.jsx**
   - In the `fetchProductos` function, after mapping the docs to productsData, add deduplication logic:
     - Filter unique products by 'nombre': `const uniqueProducts = productsData.filter((p, index, arr) => arr.findIndex(q => q.nombre === p.nombre) === index);`
     - Sort alphabetically: `uniqueProducts.sort((a, b) => a.nombre.localeCompare(b.nombre));`
     - Set the state with `setProductos(uniqueProducts);`
   - This ensures no duplicates in the admin CRUD table based on product name.

2. **Update src/components/Chatbot.jsx**
   - Add missing imports: `import React, { useState } from 'react';`
   - Initialize states: `const [isOpen, setIsOpen] = useState(false);`, `const [messages, setMessages] = useState([]);`, `const [input, setInput] = useState('');`
   - Implement `toggleChat`: `const toggleChat = () => setIsOpen(!isOpen);`
   - Implement `handleKeyPress`: `const handleKeyPress = (e) => { if (e.key === 'Enter') handleSend(); };`
   - Implement `handleSend`: 
     - Add user message: `setMessages(prev => [...prev, { text: input, sender: 'user' }]);`
     - Clear input: `setInput('');`
     - Generate simple bot response based on keywords (e.g., if input includes 'producto' or 'shop', respond 'Puedes ver nuestros productos en la página de Shop.'; else '¡Hola! ¿En qué puedo ayudarte?';)
     - Add bot message after a short delay: `setTimeout(() => setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]), 500);`
   - Ensure the JSX uses these states and functions correctly.
   - Add CSS classes for styling if needed, but assume existing.

3. **Test the Changes**
   - Run `npm run dev` to start the development server.
   - Use browser to navigate to /admin (login if needed) and verify no duplicate products in the list.
   - Navigate to /shop and confirm no duplicates there (already handled by hook).
   - Open the chatbot (click floating button), send messages, and verify user/bot messages appear.

4. **Run Unit Tests**
   - Execute `npm test` to ensure no regressions in existing tests (e.g., ProductCard.test.jsx).

5. **Update TODO.md**
   - Mark completed steps as [x] after each.

6. **Final Verification**
   - If issues found, iterate on fixes.
   - Commit changes if approved.

Last updated: Current task resumption.
