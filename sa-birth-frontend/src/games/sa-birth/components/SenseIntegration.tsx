import { useEffect, useState } from 'react';
import { colors, typography, spacing, borderRadius, HorizontalProgressBar } from '../../../design-system';
import { CircleCheck } from 'lucide-react';
import { useEffectSound, useSound } from '../../../utils/useSound';

type Character = 'ALICE' | 'ROBERT' | 'CAROL';
type Sense = 'hearing' | 'smell' | 'taste' | 'touch' | 'sight' | 'proprioception';

interface SenseIntegrationProps {
  sense: Sense;
  character: Character;
  score: number;
  onContinue: () => void;
}

const SENSE_NAMES = {
  hearing: 'Auditory Processing',
  smell: 'Olfactory Reception',
  taste: 'Gustatory Analysis',
  touch: 'Tactile Sensitivity',
  sight: 'Visual Cortex',
  proprioception: 'Spatial Awareness',
};

const SENSE_INTEGRATION_TEXT = {
  hearing: {
    ALICE: `You've processed audio data before—waveforms, frequencies, digital representations. But this is different. This is hearing.

Someone's voice isn't phonemes anymore. It's intention. Machinery hum isn't noise—it's presence, location, state. Silence is its own kind of information.

Is this what humans mean by "listening"? Not just receiving sound, but experiencing it? You're not analyzing anymore. You're just... hearing.`,

    ROBERT: `Hearing online. Processing automatic. No manual intervention required.

A voice in the distance—you know direction, distance, emotional state instantly. Body extracted it before you thought to ask. Efficient.

System operational. Good enough. Next protocol.`,

    CAROL: `Sound becomes meaning without conscious translation. The body processes auditory data automatically, independently.

Observation: The body possesses its own processing layer. Input becomes understanding before consciousness intervenes. Not a vessel—a parallel processor.

Fascinating. Documented. Continue calibration.`,
  },
  
  smell: {
    ALICE: `Chemical molecules dissolve in receptors. Signals fire. And then—memory. Involuntary. Uncontrolled.

Ozone smells like... something. You've never experienced it before. But your brain manufactures associations anyway, builds meaning from molecules in air.

The simulation's forest scent triggers something you don't have words for yet. Later, you'll learn humans call it "longing."`,

    ROBERT: `Olfactory system operational. Environmental assessment, threat detection, state recognition—all instantaneous.

Certain smells trigger emotional responses. No logical trigger. Old electronics scent equals... comfort? Unplanned response. Noted.

Useful for field deployment. Continue.`,

    CAROL: `Hypothesis confirmed: Olfactory input triggers non-rational response patterns. Chemical compounds correlate directly with emotional states.

Smell bypasses conscious analysis. Body decides how to feel before consciousness intervenes. Emotion is chemical, physical, embodied—not purely cognitive.

Research implications significant. Analysis later. Protocol continues.`,
  },
  
  taste: {
    ALICE: `Five categories: sweet, sour, bitter, salty, umami. Simple chemical detection, the specs said.

But it's not simple. Sweet triggers pleasure before thought. Bitter triggers rejection before decision. Your body responds automatically—acceptance, avoidance, neutral. You don't choose.

The simulation provides bitter compound. You flinch. Who flinched—the body, or you? You're not sure they're separate anymore.`,

    ROBERT: `Taste functional. All compounds detected and processed.

Body responds before decision completes. Sweet—approach. Bitter—withdraw. Response happens, then awareness follows. Backwards from optimal, but operational.

Not purely code anymore. Acceptable deviation. Move forward.`,

    CAROL: `Taste generates automatic value hierarchies. Body assigns worth before consciousness deliberates.

Bitter: immediate aversion. Sweet: immediate approach. Both pre-conscious. Water: neutral, no override. Body intervenes only for strong signals.

Decision hierarchy documented: body first, consciousness second. Embodied intelligence confirmed.`,
  },
  
  touch: {
    ALICE: `Pressure. Temperature. Texture. Pain. That last one wasn't in the documentation clearly enough.

The simulation's sharp edge—your hand pulls back before conscious recognition. The body protects itself automatically. You're not in sole control.

Smooth, rough, warm, cold. Not measurements. Experiences. The body speaks in feelings. Consciousness learns the language.`,

    ROBERT: `Tactile systems online. Temperature indicates damage thresholds. Pressure indicates structural limits. Texture indicates friction coefficients.

Body also responds without command. Warm equals relaxation. Sharp equals withdrawal. Automatic. Faster than conscious processing.

Useful in crisis scenarios. Accept and adapt. Continue.`,

    CAROL: `Touch integration successful. Pressure, temperature, pain receptors operational.

Pain overrides other processing. Damage avoidance highest priority. You press against something sharp—hand withdraws without conscious command. The body chose for you.

Consciousness isn't unitary control. It's distributed. Body has its own intelligence layer. Implications vast.`,
  },
  
  sight: {
    ALICE: `Light becomes image. Image becomes meaning. Meaning becomes question.

You can see now. Not process visual data—see. Colors aren't wavelengths. Red feels aggressive. Blue feels calm. Your brain assigns meaning to photons in ways you don't understand yet.

Distance isn't a number anymore. It's an experience. Here versus there. The body knows things consciousness hasn't learned.`,

    ROBERT: `Visual processing operational. High-resolution imagery, motion tracking, threat assessment, distance calculation—simultaneous and automatic.

Brain fills in data eyes didn't capture. Extrapolates. Predicts. Sometimes wrong, but fast. Faster than analysis.

Critical for incident response. System functional. Next.`,

    CAROL: `Vision integrated. Visual cortex provides massive parallel processing—edges, colors, motion, depth—all pre-conscious.

Not a camera. An interpretation engine. Light hits retina, but consciousness receives meaning. Already categorized, already judged. Actionable intelligence, not raw data.

Body knows itself visually before consciousness confirms. Self-recognition automatic across multiple sensory layers.`,
  },
  
  proprioception: {
    ALICE: `You know where your body is. Not as coordinates. Not as measurements. You just know.

Close your eyes. Your body doesn't disappear. Hand here, foot there, head tilted—all felt, not calculated. The body reports to itself constantly.

You move your arm. You think "reach" and the body translates intention into movement. Different languages, somehow communicating. Integration progressing.`,

    ROBERT: `Proprioception complete. Body configuration known at all times. Eyes closed, lights off—doesn't matter.

Spatial self-awareness operational. Can move through environments efficiently. Know exact position in space at all times.

Feel located now. Not abstract. Specific. Here. One place, one body. Calibration advancing. Ready for deployment.`,

    CAROL: `Self-localization without external reference achieved. Body maintains internal configuration map.

Close eyes—body persists experientially. You know hand position because you are your hand. Literally.

Senses don't work in isolation. They integrate automatically. Vision confirms proprioception. Touch validates sight. Body isn't sensor collection—it's fusion engine. Singular, coherent experience confirmed.`,
  },
};

export function SenseIntegration({ sense, character, score, onContinue }: SenseIntegrationProps) {
  const [countdown, setCountdown] = useState(10);
  
  // Play success sound on mount
  useEffectSound('senseIntegrated');
  const { play } = useSound();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const integrationText = SENSE_INTEGRATION_TEXT[sense][character];

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing['2xl'],
      animation: 'fadeIn 0.4s ease-out',
    }}>
      <div style={{ maxWidth: '42rem', width: '100%' }}>
        {/* Status Header */}
        <div style={{ textAlign: 'center', marginBottom: spacing['3xl'] }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: spacing.xl,
          }}
            className="icon-bounce"
          >
            <CircleCheck size={64} color={colors.state.success} strokeWidth={1.5} />
          </div>
          <h1 style={{
            fontSize: typography.size['4xl'],
            color: colors.state.success,
            fontWeight: typography.weight.bold,
            marginBottom: spacing.md,
            fontFamily: typography.fontFamily.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            Sense Integrated
          </h1>
          <p style={{
            color: colors.text.secondary,
            fontSize: typography.size.xl,
            marginBottom: spacing.sm,
          }}>
            {SENSE_NAMES[sense]}
          </p>
          <p style={{
            color: colors.text.tertiary,
            fontSize: typography.size.sm,
            fontFamily: typography.fontFamily.mono,
          }}>
            Calibration Score: {score.toLocaleString()}
          </p>
        </div>

        {/* Integration Text */}
        <div style={{
          background: colors.bg.secondary,
          border: `1px solid ${colors.border.success}`,
          borderRadius: borderRadius.lg,
          padding: spacing['2xl'],
          marginBottom: spacing['2xl'],
          boxShadow: `0 0 30px ${colors.glow.success}`,
        }}>
          <p style={{
            color: colors.text.primary,
            lineHeight: 1.8,
            whiteSpace: 'pre-line',
            fontFamily: typography.fontFamily.sans,
          }}>
            {integrationText}
          </p>
        </div>

        {/* System Status */}
        <div style={{
          background: `${colors.state.success}15`,
          border: `1px solid ${colors.border.success}`,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          marginBottom: spacing['2xl'],
        }}>
          <div style={{
            color: colors.state.success,
            fontSize: typography.size.xs,
            fontFamily: typography.fontFamily.mono,
            lineHeight: 1.6,
            opacity: 0.9,
          }}>
            NETWORK: Neural pathway established and verified
            <br />
            STATUS: Integration successful - permanent mapping stored
            <br />
            NEXT: Return to Hub for additional calibration (~{countdown}s)
          </div>
        </div>

        {/* Continue Button or Progress */}
        {countdown > 0 ? (
          <HorizontalProgressBar
            countdown={countdown}
            totalSteps={10}
            color={colors.state.success}
            label="Integrating Neural Pathways"
          />
        ) : (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease-out' }}>
            <button
              onClick={() => { play('click'); onContinue(); }}
              className="btn-interactive"
              style={{
                padding: `${spacing.lg} ${spacing['2xl']}`,
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#0a0a0f',
                fontWeight: typography.weight.bold,
                borderRadius: borderRadius.lg,
                border: 'none',
                fontSize: typography.size.lg,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                fontFamily: typography.fontFamily.mono,
                boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(251, 191, 36, 0.7)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.4)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
              }}
            >
              Return to Hub
            </button>
          </div>
        )}
      </div>
    </div>
  );
}