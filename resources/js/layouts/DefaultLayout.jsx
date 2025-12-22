import { Outlet } from "react-router-dom";

export default function DefaultLayout() {
  return (
    <div>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
