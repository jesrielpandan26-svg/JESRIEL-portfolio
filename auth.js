const signInForm = document.getElementById('sign-in-form');
const signUpForm = document.getElementById('sign-up-form');

const showSignUp = document.getElementById('show-signup');
const showSignIn = document.getElementById('show-signin');

showSignUp.addEventListener('click', () => {
  signInForm.classList.remove('active');
  signUpForm.classList.remove('slide-up');
  
  signUpForm.classList.add('active', 'fade-in');
});

showSignIn.addEventListener('click', () => {
  signUpForm.classList.remove('active');
  signInForm.classList.add('active', 'fade-in');
});

// Redirect after login
signInForm.addEventListener('submit', (e) => {
  e.preventDefault();
  // show loader and simulate authentication
  const loader = document.getElementById('loader-overlay');
  const signInBtn = signInForm.querySelector('button[type="submit"]');
  const msg = document.getElementById('auth-message');
  if (loader) loader.style.display = 'flex';
  if (signInBtn) signInBtn.disabled = true;
  // simulate network/auth delay
  (async () => {
    try {
      const email = document.getElementById('signin-email').value.trim().toLowerCase();
      const password = document.getElementById('signin-password').value || '';
      // basic validation
      if (!email || !password) {
        if (msg) { msg.textContent = 'Please enter email and password.'; msg.hidden = false; msg.classList.add('show'); }
        if (loader) loader.style.display = 'none';
        if (signInBtn) signInBtn.disabled = false;
        return;
      }

      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const user = users[email];
      if (!user) {
        if (msg) { msg.textContent = 'No account found for that email. Please sign up.'; msg.hidden = false; msg.classList.add('show'); }
        if (loader) loader.style.display = 'none';
        if (signInBtn) signInBtn.disabled = false;
        return;
      }

      // verify password
      const pwHash = await hashPassword(password);
      if (pwHash !== user.passwordHash) {
        if (msg) { msg.textContent = 'Incorrect password.'; msg.hidden = false; msg.classList.add('show'); }
        if (loader) loader.style.display = 'none';
        if (signInBtn) signInBtn.disabled = false;
        return;
      }

      // success: prefer showing the registered name (no @); keep loader visible a bit longer
      const displayName = (user && user.name) ? user.name : (email.split('@')[0] || email);
      if (loader) {
        // keep keyboard loader visible for an extra 900ms for better UX
        setTimeout(() => {
          loader.style.display = 'none';
          if (msg) { msg.textContent = `Signed in as ${displayName}`; msg.hidden = false; msg.classList.add('show'); }
          if (signInBtn) signInBtn.disabled = false;
          setTimeout(() => window.location.href = 'index.html', 700);
        }, 900);
      } else {
        if (msg) { msg.textContent = `Signed in as ${displayName}`; msg.hidden = false; msg.classList.add('show'); }
        if (signInBtn) signInBtn.disabled = false;
        setTimeout(() => window.location.href = 'index.html', 700);
      }
    } catch (err) {
      console.error('Sign-in error', err);
      if (msg) { msg.textContent = 'An error occurred. Try again.'; msg.hidden = false; msg.classList.add('show'); }
      if (loader) loader.style.display = 'none';
      if (signInBtn) signInBtn.disabled = false;
    }
  })();
});

signUpForm.addEventListener('submit', (e) => {
  e.preventDefault();
  (async () => {
    const name = document.getElementById('signup-name').value.trim();
    const email = (document.getElementById('signup-email').value || '').trim().toLowerCase();
    const password = document.getElementById('signup-password').value || '';
    const msg = document.getElementById('auth-message');

    if (!name || !email || !password) {
      if (msg) { msg.textContent = 'Please fill all sign-up fields.'; msg.hidden = false; msg.classList.add('show'); }
      return;
    }

    // simple email format check
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      if (msg) { msg.textContent = 'Please provide a valid email address.'; msg.hidden = false; msg.classList.add('show'); }
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[email]) {
      if (msg) { msg.textContent = 'An account with this email already exists. Please sign in.'; msg.hidden = false; msg.classList.add('show'); }
      return;
    }

    try {
      const passwordHash = await hashPassword(password);
      users[email] = { name, passwordHash };
      localStorage.setItem('users', JSON.stringify(users));
      if (msg) { msg.textContent = `Account created for ${name}. Please sign in.`; msg.hidden = false; msg.classList.add('show'); }
      // switch to sign-in view
      signUpForm.classList.remove('active');
      signInForm.classList.add('active', 'fade-in');
      signUpForm.reset();
    } catch (err) {
      console.error('Sign-up error', err);
      if (msg) { msg.textContent = 'Failed to create account. Try again.'; msg.hidden = false; msg.classList.add('show'); }
    }
  })();
});

// Utility: hash a string (password) using SHA-256 and return hex
async function hashPassword(pw) {
  if (!pw) return '';
  const enc = new TextEncoder();
  const data = enc.encode(pw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Ensure page loader hides on load (auth page)
window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  setTimeout(() => { loader.classList.add('hide'); setTimeout(() => { if (loader && loader.parentNode) loader.style.display = 'none'; }, 520); }, 360);
});
