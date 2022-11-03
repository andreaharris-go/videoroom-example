import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import fetchJson from "@/utils/fetchJson";
import SvgGmailLogo from "@/components/svg/svgGmailLogo";
import useUser from "@/hooks/useUser";
import Head from "next/head";
import TopHeader from "@/components/pages/video/topHeader";

const googleProvider = new GoogleAuthProvider();
const auth = getAuth()

export default function SignIn({}) {
  const { mutateUser } = useUser({
    redirectTo: "/",
    redirectIfFound: true,
  });

  return (
    <>
      <Head>
        <title>Demo JANUS (multistream): Sign In</title>
      </Head>
      <TopHeader />
      <div className="flex justify-center">
        <button
          type="button"
          className={`w-1/2 block font-semibold rounded-lg px-4 py-3 border-1 bg-white shadow ease-in-out transition-transform transform hover:shadow-lg transition hover:bg-blue-100`}
          onClick={() => {
            signInWithPopup(auth, googleProvider)
              .then(async result => {
                const credential = GoogleAuthProvider.credentialFromResult(Object.assign(result, {providerId: 'google.com'}))
                const encodeUser = window.btoa(unescape(encodeURIComponent(JSON.stringify({...result.user, ...credential}))))
                mutateUser(
                  await fetchJson("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(encodeUser),
                  }),
                  false,
                );
              })
              .catch(err => {
                console.log(err)

                if (err.code === 'auth/popup-closed-by-user') {
                  //
                }
              })
          }}
        >
          <div className="flex items-center justify-center">
            <div className="flex w-40">
              <SvgGmailLogo propsClass={`w-6 h-6`} />
              <span className="ml-4">Google Sign In</span>
            </div>
          </div>
        </button>
      </div>
    </>
  )
}
