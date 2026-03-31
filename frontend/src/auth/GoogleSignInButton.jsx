import React, { useEffect, useRef } from "react";
import { useGoogleOAuth } from "@react-oauth/google";

let initializedClientId = null;
let activeCredentialHandler = null;

function ensureGoogleIdentityInitialized(clientId) {
  const googleIdentity = window.google?.accounts?.id;
  if (!googleIdentity || !clientId) {
    return false;
  }

  if (initializedClientId !== clientId) {
    googleIdentity.initialize({
      client_id: clientId,
      callback: (credentialResponse) => {
        activeCredentialHandler?.(credentialResponse);
      },
    });
    initializedClientId = clientId;
  }

  return true;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  theme = "outline",
  size = "large",
  shape = "pill",
  text = "signin_with",
  width = 260,
}) {
  const containerRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const { clientId, scriptLoadedSuccessfully } = useGoogleOAuth();

  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!scriptLoadedSuccessfully || !containerRef.current) {
      return undefined;
    }

    activeCredentialHandler = (credentialResponse) => {
      if (!credentialResponse?.credential) {
        onErrorRef.current?.();
        return;
      }
      onSuccessRef.current?.(credentialResponse);
    };

    const initialized = ensureGoogleIdentityInitialized(clientId);
    if (!initialized) {
      onErrorRef.current?.();
      return undefined;
    }

    containerRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(containerRef.current, {
      type: "standard",
      theme,
      size,
      text,
      shape,
      width,
    });

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [clientId, scriptLoadedSuccessfully, shape, size, text, theme, width]);

  return <div ref={containerRef} />;
}
