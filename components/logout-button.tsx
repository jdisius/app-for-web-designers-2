import { logOut } from "@/app/actions/auth";
import { buttonClass } from "@/components/field";

// Temporary home for logout; step 6 moves it to the profile page.
export function LogoutButton() {
  return (
    <form action={logOut}>
      <button className={buttonClass}>Odhlásit se</button>
    </form>
  );
}
