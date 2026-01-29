import ProtectedClient from "@/components/ProtectedClient";
import Original from "./home/page";

export default function Home() {
  return (
    <ProtectedClient>
      <Original />
    </ProtectedClient>
  );
}
