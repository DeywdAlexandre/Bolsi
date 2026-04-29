import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

type Listener = (text: string, isFinal: boolean) => void;

type State = {
  supported: boolean;
  listening: boolean;
  error: string | null;
};

type Engine = {
  start: (locale: string, onResult: Listener, onEnd: () => void, onError: (msg: string) => void) => Promise<void>;
  stop: () => void;
};

function createWebEngine(): Engine | null {
  if (typeof window === "undefined") return null;
  const SR =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  let instance: any = null;
  return {
    async start(locale, onResult, onEnd, onError) {
      instance = new SR();
      instance.lang = locale;
      instance.interimResults = true;
      instance.continuous = false;
      instance.onresult = (e: any) => {
        let interim = "";
        let final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) final += r[0].transcript;
          else interim += r[0].transcript;
        }
        if (final) onResult(final.trim(), true);
        else if (interim) onResult(interim.trim(), false);
      };
      instance.onerror = (e: any) => onError(e.error || "speech_error");
      instance.onend = () => onEnd();
      instance.start();
    },
    stop() {
      try {
        instance?.stop();
      } catch {}
    },
  };
}

function createNativeEngine(): Engine | null {
  try {
    const mod = require("expo-speech-recognition");
    const { ExpoSpeechRecognitionModule } = mod;
    if (!ExpoSpeechRecognitionModule) return null;

    const subs: { remove: () => void }[] = [];
    const cleanup = () => {
      while (subs.length) subs.pop()?.remove();
    };

    return {
      async start(locale, onResult, onEnd, onError) {
        const perms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!perms.granted) {
          onError("Permissão de microfone negada");
          return;
        }
        cleanup();
        subs.push(
          mod.addSpeechRecognitionListener("result", (e: any) => {
            const transcript: string =
              e?.results?.[0]?.transcript ?? e?.value?.[0] ?? "";
            if (transcript) onResult(transcript.trim(), !!e?.isFinal);
          }),
        );
        subs.push(
          mod.addSpeechRecognitionListener("error", (e: any) => {
            onError(e?.message || e?.error || "speech_error");
          }),
        );
        subs.push(
          mod.addSpeechRecognitionListener("end", () => {
            cleanup();
            onEnd();
          }),
        );
        ExpoSpeechRecognitionModule.start({
          lang: locale,
          interimResults: true,
          continuous: false,
          requiresOnDeviceRecognition: false,
        });
      },
      stop() {
        try {
          ExpoSpeechRecognitionModule.stop();
        } catch {}
        cleanup();
      },
    };
  } catch {
    return null;
  }
}

export function useSpeechRecognition(locale = "pt-BR") {
  const engineRef = useRef<Engine | null>(null);
  const [state, setState] = useState<State>({
    supported: false,
    listening: false,
    error: null,
  });

  useEffect(() => {
    const engine = Platform.OS === "web" ? createWebEngine() : createNativeEngine();
    engineRef.current = engine;
    setState((s) => ({ ...s, supported: !!engine }));
    return () => {
      try {
        engine?.stop();
      } catch {}
    };
  }, []);

  const start = useCallback(
    (onText: Listener) => {
      const engine = engineRef.current;
      if (!engine) return;
      setState((s) => ({ ...s, listening: true, error: null }));
      void engine.start(
        locale,
        (text, isFinal) => onText(text, isFinal),
        () => setState((s) => ({ ...s, listening: false })),
        (msg) => setState((s) => ({ ...s, listening: false, error: msg })),
      );
    },
    [locale],
  );

  const stop = useCallback(() => {
    engineRef.current?.stop();
    setState((s) => ({ ...s, listening: false }));
  }, []);

  return { ...state, start, stop };
}
