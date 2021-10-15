import { useEffect, useRef } from 'react';

import styles from './SampleLayout.module.css';

export type SampleInit = (params: {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}) => void | Promise<void>;

const SampleLayout: React.FunctionComponent<
  React.PropsWithChildren<{
    init: SampleInit;
  }>
> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const guiParentRef = useRef<HTMLDivElement | null>(null);
  const init = props.init;

  useEffect(() => {
    try {
      const p = init({
        canvasRef,
      });

      if (p instanceof Promise) {
        p.catch((err: Error) => {
          console.error(err);
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, [init]);

  return (
    <main>
      <div className={styles.canvasContainer}>
        <div
          style={{
            position: 'absolute',
            right: 10,
          }}
          ref={guiParentRef}
        ></div>
        <canvas ref={canvasRef} width={600} height={600}></canvas>
      </div>
    </main>
  );
};

export default SampleLayout;

export const makeSample: (
  ...props: Parameters<typeof SampleLayout>
) => JSX.Element = (props) => {
  return <SampleLayout {...props} />;
};