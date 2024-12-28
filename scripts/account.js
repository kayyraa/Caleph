import * as Api from "./api.js";

const Form = document.querySelector(".Account");
const Users = new Api.Storage("Users");

if (Form) {
    const UsernameInput = Form.querySelectorAll("input")[0];
    const PasswordInput = Form.querySelectorAll("input")[1];
    const Button = Form.querySelector("button");

    Button.addEventListener("click", async () => {
        const Username = UsernameInput.value;
        const Password = PasswordInput.value;
        if (!Username || !Password) return;

        const User = {
            Username: Username,
            Password: Password,
            Timestamp: Math.floor(Date.now() / 1000)
        }

        const UserExists = await Users.GetDocumentsByField("Username", Username);
        if (UserExists && UserExists[0]) {
            if (UserExists[0].Password == Password) {
                localStorage.setItem("User", JSON.stringify(User));
                location.href = "../index.html";
            }
        } else {
            await Users.AppendDocument(User);
            localStorage.setItem("User", JSON.stringify(User));
            location.href = "../index.html";
        }
    });
} else {
    const LogInButton = document.querySelector(".LogInButton");
    const LogOutButton = document.querySelector(".LogOutButton");
    if (LogOutButton && LogInButton && localStorage.getItem("User")) {
        const User = JSON.parse(localStorage.getItem("User"));
        const UserExists = await Users.GetDocumentsByField("Username", User.Username);

        if (UserExists) {
            LogInButton.remove(); 
            LogOutButton.innerHTML = User.Username
        } else LogOutButton.remove();
    }
}