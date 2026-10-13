import { useEffect, useRef, useState } from "react";
import { broadcastDate, celebrations, commendations, nextStage, pick, programmeNumber, sponsors, stageProps, type BroadcastStage, type StageProp } from "./broadcast";

type Broadcast = {
  number: number;
  event: string;
  praise: string;
  prop: StageProp;
};

const stageDelay: Record<Exclude<BroadcastStage, "standby" | "ticket">, number> = {
  headline: 2050,
  praise: 2350,
  ceremony: 3200
};

function PropMark({ prop, faded = false }: { prop: StageProp; faded?: boolean }) {
  return <figure className={`prop prop-${prop.kind}${faded ? " faded" : ""}`} title={prop.name} aria-label={prop.name}>
    <svg viewBox="0 0 90 90" role="img" aria-hidden="true">
      {prop.kind === "ribbon" && <><path d="M18 20c20 8 34 5 54-7-1 20-15 31-31 33 8 9 9 19 3 29-10-15-20-19-34-17 12-12 16-25 8-38Z" /><path d="M19 19c12 8 24 10 35 9" /></>}
      {prop.kind === "trophy" && <><path d="M24 17h43v25c0 17-10 26-21 26S24 59 24 42V17Z" /><path d="M25 23H13c0 17 6 24 18 24M66 23h12c0 17-6 24-18 24M46 67v11M31 79h30" /></>}
      {prop.kind === "cake" && <><path d="M17 35h56v37H17Z" /><path d="M22 35c-4-10 7-17 13-9 3-11 16-11 20-1 8-7 19 1 14 10M17 53h56M30 42h1M46 42h1M61 42h1" /><path d="M46 25V10M41 11h10" /></>}
      {prop.kind === "flag" && <><path d="M26 12v68M27 18c18-10 29 9 43-2v34c-14 11-25-8-43 2" /><path d="M34 28h26M34 39h22" /></>}
      {prop.kind === "flower" && <><circle cx="45" cy="35" r="9" /><path d="M45 26c-16-17-28 0-13 11-20 1-14 22 0 15-8 17 12 20 13 4 9 16 29 5 13-10 19-4 12-24-3-14M45 44v35M45 64c-8-6-15-6-21-3M45 70c8-7 14-8 20-5" /></>}
      {prop.kind === "balloon" && <><path d="M45 10c20 0 28 19 19 34-5 8-12 13-19 19-7-6-14-11-19-19C17 29 25 10 45 10Z" /><path d="M42 64h6l-3 5ZM45 69c-2 8 4 10-2 17" /></>}
      {prop.kind === "medal" && <><path d="M27 11h14l5 22-11 8-12-20ZM49 11h14l-7 20-11 2Z" /><circle cx="45" cy="55" r="20" /><path d="m45 42 4 9 10 1-8 7 3 10-9-5-9 5 3-10-8-7 10-1Z" /></>}
      {prop.kind === "lamp" && <><path d="M45 12a23 23 0 0 1 18 37l-5 7H32l-5-7a23 23 0 0 1 18-37ZM32 63h26M35 72h20M39 79h12" /><path d="M45 2v6M14 25l6 3M76 25l-6 3" /></>}
    </svg>
    <figcaption>{prop.name}</figcaption>
  </figure>;
}

function Host() {
  return <div className="host" aria-label="真顔の司会者">
    <div className="host-light" /><div className="host-head"><i /><i /></div><div className="host-body"><span>祝賀会放送局</span></div>
  </div>;
}

export default function App() {
  const [stage, setStage] = useState<BroadcastStage>("standby");
  const [sequence, setSequence] = useState(1);
  const [cursor, setCursor] = useState(() => Math.floor(Math.random() * celebrations.length));
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [residualProps, setResidualProps] = useState<StageProp[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const soundRef = useRef(false);

  const nextEvent = pick(celebrations, cursor);
  const sponsor = pick(sponsors, cursor + sequence);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      void audio.current?.close();
    };
  }, []);

  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);

  useEffect(() => {
    if (stage === "standby" || stage === "ticket") return;
    const delay = reducedMotion ? 900 : stageDelay[stage];
    const id = window.setTimeout(() => {
      if (stage === "ceremony" && broadcast) setResidualProps((current) => [...current.slice(-3), broadcast.prop]);
      cue(stage === "headline" ? 587 : stage === "praise" ? 740 : 880, stage === "ceremony" ? 0.35 : 0.13);
      setStage(nextStage(stage));
    }, delay);
    return () => window.clearTimeout(id);
  }, [broadcast, reducedMotion, stage]);

  function cue(frequency: number, volume: number) {
    if (!soundRef.current || !audio.current) return;
    const oscillator = audio.current.createOscillator();
    const gain = audio.current.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audio.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.current.currentTime + 0.38);
    oscillator.connect(gain).connect(audio.current.destination);
    oscillator.start();
    oscillator.stop(audio.current.currentTime + 0.4);
  }

  async function toggleSound() {
    if (soundEnabled) {
      setSoundEnabled(false);
      return;
    }
    audio.current ??= new AudioContext();
    await audio.current.resume();
    setSoundEnabled(true);
    soundRef.current = true;
    cue(660, 0.12);
  }

  function begin() {
    const next = {
      number: sequence,
      event: nextEvent,
      praise: pick(commendations, cursor * 3 + sequence),
      prop: pick(stageProps, cursor + sequence * 2)
    };
    setBroadcast(next);
    cue(523, 0.16);
    setStage("headline");
  }

  function prepareNext() {
    setSequence((current) => current + 1);
    setCursor((current) => current + 1);
    setStage("standby");
  }

  const visibleProps = residualProps.slice(-4);

  return <main className={reducedMotion ? "reduced" : ""}>
    <header className="station-header">
      <a href="https://www.ikg-systems.com/#experiments">← IKG Systems の実験へ</a>
      <p>深夜祝賀会放送局　生放送ではありません</p>
      <button type="button" className="sound-toggle" aria-pressed={soundEnabled} onClick={() => void toggleSound()}>{soundEnabled ? "音声設備：稼働中" : "音声設備：停止中"}</button>
    </header>

    <section className={`studio stage-${stage}`} aria-live="polite">
      <div className="ceiling" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <aside className="former-props" aria-label="先週の栄光">
        <p>先週の栄光</p>
        {visibleProps.length ? visibleProps.map((prop, index) => <PropMark key={`${prop.name}-${index}`} prop={prop} faded />) : <small>まだ、何も残っていません。</small>}
      </aside>
      <div className="side-monitor"><span>CH. 03</span><b>只今、祝賀待機中</b><em>本日の対象を、過剰に待機しています</em></div>
      <div className="curtain curtain-left" /><div className="curtain curtain-right" />

      {stage === "standby" && <section className="opening">
        <p className="on-air"><i /> 間もなく、ささやかな祝賀です</p>
        <h1>SHUKUGAKAI</h1>
        <p className="subtitle">ちいさな祝賀会放送局</p>
        <div className="tonight"><span>今夜、祝うべきこと</span><strong>「{nextEvent}」</strong><small>当局が、勝手に選定しました。</small></div>
        <button type="button" className="start-button" onClick={begin}><b>祝賀開始</b><span>RED BUTTON / 押すだけです</span></button>
        <p className="opening-note">8秒ほど、局員全員が本気になります。</p>
      </section>}

      {stage !== "standby" && broadcast && <section className="live-broadcast">
        <div className="broadcast-top"><span>只今の生放送　{programmeNumber(broadcast.number)}</span><b>祝賀対象：{broadcast.event}</b><i>録画ではありません。演出です。</i></div>
        <Host />
        {stage === "headline" && <div className="headline"><p>緊 急 祝 賀</p><strong>「{broadcast.event}」</strong><span>が確認されました</span></div>}
        {stage === "praise" && <div className="praise"><span>司会者より、正式なコメントです</span><strong>「{broadcast.praise}」</strong><em>まもなく、必要以上の式典に入ります。</em></div>}
        {stage === "ceremony" && <div className="ceremony">
          <div className="confetti" aria-hidden="true">{Array.from({ length: 30 }, (_, index) => <i key={index} />)}</div>
          <p>局員総出の式典</p><strong>祝賀用小道具「{broadcast.prop.name}」入場</strong><div className="featured-prop"><PropMark prop={broadcast.prop} /></div><span>拍手は、各自の心の中で大きめにお願いします。</span>
        </div>}
        {stage === "ticket" && <section className="ticket">
          <p>視 聴 記 念 票</p><i>深夜祝賀会放送局　発行</i><div className="ticket-rule" /><small>{broadcastDate()}</small><strong>{programmeNumber(broadcast.number)}</strong><b>「{broadcast.event}」を<br />当局が全力で祝賀したことを証明します。</b><em>祝賀対象者：この画面を見ていた方</em><button type="button" onClick={prepareNext}>次の些細な偉業を待つ</button>
        </section>}
      </section>}
      <div className="sponsor-ticker"><span>{sponsor}</span><b>この番組は、どうでもよさを丁重に扱う皆さまのご協力でお送りします。</b></div>
    </section>
    <footer>記録は残しません。放送のあとには、少しだけ紙吹雪が残ります。</footer>
  </main>;
}
