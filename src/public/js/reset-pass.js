
const form = document.getElementById('form');
const messageTag = document.getElementById("message");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm-password");
const notification = document.getElementById("notification");
const submitBtn = document.getElementById("submit");
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

form.style.display = "none";
let token, id;
window.addEventListener("DOMContentLoaded", async () => {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });

    token = params.token;
    id = params.id;

    try {
        const res = await fetch('/auth/verify-pass-reset-token', {
            method: "POST",
            body: JSON.stringify({ token, id }),
            headers: {
                'Content-Type': "application/json;charset=utf-8",
            },
        });

        if (!res.ok) {
            const { message } = await res.json();
            messageTag.innerText = message;
            messageTag.classList.add('error');
            return;
        }

        messageTag.style.display = "none";
        form.style.display = "block";
    } catch (error) {
        messageTag.innerText = "An error occurred. Please try again later.";
        messageTag.classList.add('error');
    }
});

const displayNotification = (message, type) => {
    notification.style.display = 'block'
    notification.innerHTML = message;
    notification.classList.add(type);
}
const handleSubmit = async (evt) => {
    evt.preventDefault();
    if(!passwordRegex.test(password.value)){
        return displayNotification("Invalid password use alpha numeric and special chars!", "error");
        //@$*12Pinku420 password format
    }
    if(password.value !== confirmPassword.value){
        return displayNotification("Password is do not match!", "error");
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "Please wait..."
  const res =  await fetch("/auth/reset-pass",{
        method: "POST",
        headers:{
            "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify({
            id,
            token,
            password: password.value
        }),
    });
    submitBtn.disabled = false;
    submitBtn.innerText = "update password";
    if(!res.ok){
        const {message} = await res.json();
        return displayNotification(message, "error");
    }
    messageTag.style.display = "block";
    messageTag.innerText = "Your password update successfully"
    form.style.display = "none";
  };
form.addEventListener('submit', handleSubmit)
