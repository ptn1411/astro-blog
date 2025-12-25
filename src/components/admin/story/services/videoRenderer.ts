import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import html2canvas from 'html2canvas';
import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { flushSync } from 'react-dom';
import { resolveMediaUrl } from '~/utils/mediaUrl';
import type { ExportSettings } from '../ui/modals';
import { RESOLUTION_MAP } from '../ui/modals';
import type { Story, StorySlide } from '../types';

export interface RenderCallbacks {
  setIsRendering: (value: boolean) => void;
  setRenderProgress: (value: number) => void;
  setLoadingStatus: (value: string) => void;
  setRenderTime: (value: number) => void;
  setCurrentSlideId: (id: string) => void;
}

// WebCodecs-based high quality render
export async function renderWithWebCodecs(
  story: Story,
  currentSlide: StorySlide,
  settings: ExportSettings,
  ffmpegRef: React.MutableRefObject<FFmpeg>,
  callbacks: RenderCallbacks
): Promise<void> {
  const { setIsRendering, setRenderProgress, setLoadingStatus, setRenderTime, setCurrentSlideId } = callbacks;

  // Check browser support
  if (!('VideoEncoder' in window)) {
    throw new Error('WebCodecs API not supported');
  }

  setIsRendering(true);
  setRenderProgress(0);
  setLoadingStatus('Initializing encoder...');

  await new Promise((r) => setTimeout(r, 300));

  const { fps, bitrate, resolution, exportAllSlides } = settings;
  const { width, height } = RESOLUTION_MAP[resolution];

  const slidesToExport = exportAllSlides ? story.slides : [currentSlide].filter(Boolean);
  if (slidesToExport.length === 0) {
    throw new Error('No slides to export');
  }

  const totalDuration = slidesToExport.reduce((sum, slide) => sum + (slide.duration || 5), 0);
  const totalFrames = Math.ceil(totalDuration * fps);

  const element = document.getElementById('render-container');
  if (!element) {
    throw new Error('Render container missing. Please try again.');
  }

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  const ctx = offscreenCanvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) throw new Error('Failed to create canvas context');

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width, height },
    firstTimestampBehavior: 'offset',
    fastStart: 'in-memory',
  });

  let frameCount = 0;
  let globalFrameIndex = 0;

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { throw e; },
  });

  encoder.configure({
    codec: 'avc1.640028',
    width,
    height,
    bitrate,
    framerate: fps,
    hardwareAcceleration: 'prefer-hardware',
    latencyMode: 'quality',
  });

  setLoadingStatus('Capturing frames...');

  for (let slideIndex = 0; slideIndex < slidesToExport.length; slideIndex++) {
    const slide = slidesToExport[slideIndex];
    const slideDuration = slide.duration || 5;
    const slideFrames = Math.ceil(slideDuration * fps);

    if (exportAllSlides) {
      setCurrentSlideId(slide.id);
      await new Promise((r) => setTimeout(r, 100));
    }

    for (let i = 0; i < slideFrames; i++) {
      const time = (i / fps) * 1000;

      flushSync(() => {
        setRenderTime(time);
      });

      await new Promise((r) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(r, 16);
          });
        });
      });

      const tempCanvas = await html2canvas(element, {
        canvas: offscreenCanvas,
        scale: 1,
        width,
        height,
        backgroundColor: slide.background.type === 'color' ? slide.background.value : '#ffffff',
        useCORS: true,
        logging: false,
        allowTaint: true,
      });

      const videoFrame = new VideoFrame(tempCanvas, {
        timestamp: (globalFrameIndex * 1_000_000) / fps,
        duration: 1_000_000 / fps,
      });

      encoder.encode(videoFrame, { keyFrame: globalFrameIndex % fps === 0 });
      videoFrame.close();

      frameCount++;
      globalFrameIndex++;
      setRenderProgress(Math.round((globalFrameIndex / totalFrames) * 100));
      setLoadingStatus(
        exportAllSlides
          ? `Slide ${slideIndex + 1}/${slidesToExport.length} - Frame ${i + 1}/${slideFrames}`
          : `Encoding frame ${i + 1}/${slideFrames}`
      );
    }
  }

  setLoadingStatus('Finalizing video...');
  await encoder.flush();
  encoder.close();

  muxer.finalize();
  const { buffer } = muxer.target;

  // Handle audio if needed
  const hasAudio = story.audio?.src || slidesToExport.some((slide) => slide.audio?.src);
  const audioSrc = story.audio?.src || slidesToExport.find((s) => s.audio?.src)?.audio?.src;

  if (settings.includeAudio && hasAudio && audioSrc) {
    setLoadingStatus('Adding audio track...');

    try {
      const ffmpeg = ffmpegRef.current;

      if (!ffmpeg.loaded) {
        setLoadingStatus('Loading audio encoder...');
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      setLoadingStatus('Processing audio...');

      await ffmpeg.writeFile('video.mp4', new Uint8Array(buffer));

      const resolvedAudioSrc = resolveMediaUrl(audioSrc);
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 15000);

      const audioResponse = await fetch(resolvedAudioSrc, { signal: controller.signal });
      clearTimeout(fetchTimeout);

      const audioBlob = await audioResponse.blob();
      const audioBuffer = await audioBlob.arrayBuffer();
      const audioExt = audioSrc.split('.').pop()?.split('?')[0] || 'mp3';
      await ffmpeg.writeFile(`audio.${audioExt}`, new Uint8Array(audioBuffer));

      setLoadingStatus('Muxing audio and video...');

      await ffmpeg.exec([
        '-i', 'video.mp4',
        '-i', `audio.${audioExt}`,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest',
        '-y', 'output.mp4',
      ]);

      const outputData = await ffmpeg.readFile('output.mp4');
      const outputBlob = new Blob([outputData as unknown as BlobPart], { type: 'video/mp4' });

      setLoadingStatus('Downloading...');
      downloadBlob(outputBlob, `${story.title.replace(/\s+/g, '-').toLowerCase()}_${resolution}.mp4`);

      // Cleanup
      try {
        await ffmpeg.deleteFile('video.mp4');
        await ffmpeg.deleteFile(`audio.${audioExt}`);
        await ffmpeg.deleteFile('output.mp4');
      } catch { /* ignore */ }

      return;
    } catch (audioErr) {
      console.error('Failed to add audio:', audioErr);
    }
  }

  setLoadingStatus('Downloading...');
  const mp4Blob = new Blob([buffer], { type: 'video/mp4' });
  downloadBlob(mp4Blob, `${story.title.replace(/\s+/g, '-').toLowerCase()}_${resolution}.mp4`);
}

// FFmpeg fallback render
export async function renderWithFFmpeg(
  story: Story,
  currentSlide: StorySlide,
  settings: ExportSettings,
  ffmpegRef: React.MutableRefObject<FFmpeg>,
  callbacks: RenderCallbacks
): Promise<void> {
  const { setIsRendering, setRenderProgress, setLoadingStatus, setRenderTime, setCurrentSlideId } = callbacks;

  setIsRendering(true);
  setRenderProgress(0);
  setLoadingStatus('Initializing video engine (FFmpeg)...');

  await new Promise((r) => setTimeout(r, 500));

  const ffmpeg = ffmpegRef.current;
  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL: await toBlobURL(`/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`/ffmpeg-core.wasm`, 'application/wasm'),
    });
  }

  const { fps, resolution, exportAllSlides } = settings;
  const { width, height } = RESOLUTION_MAP[resolution];

  const slidesToExport = exportAllSlides ? story.slides : [currentSlide].filter(Boolean);
  if (slidesToExport.length === 0) {
    throw new Error('No slides to export');
  }

  const totalDuration = slidesToExport.reduce((sum, slide) => sum + (slide.duration || 5), 0);
  const totalFrames = Math.ceil(totalDuration * fps);

  const element = document.getElementById('render-container');
  if (!element) throw new Error('Render container missing');

  let globalFrameIndex = 0;

  for (let slideIndex = 0; slideIndex < slidesToExport.length; slideIndex++) {
    const slide = slidesToExport[slideIndex];
    const slideDuration = slide.duration || 5;
    const slideFrames = Math.ceil(slideDuration * fps);

    if (exportAllSlides) {
      setCurrentSlideId(slide.id);
      await new Promise((r) => setTimeout(r, 100));
    }

    const canvasConfig = {
      scale: 1,
      width,
      height,
      backgroundColor: slide.background.type === 'color' ? slide.background.value : '#ffffff',
      useCORS: true,
      logging: false,
      allowTaint: true,
    };

    for (let i = 0; i < slideFrames; i++) {
      setLoadingStatus(
        exportAllSlides
          ? `Slide ${slideIndex + 1}/${slidesToExport.length} - Frame ${i + 1}/${slideFrames}`
          : `Rendering frame ${i + 1}/${slideFrames}`
      );
      const time = (i / fps) * 1000;

      flushSync(() => {
        setRenderTime(time);
      });

      await new Promise((r) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(r);
        });
      });

      const canvas = await html2canvas(element, canvasConfig);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.95));

      if (!blob) continue;

      const fileName = `frame-${String(globalFrameIndex).padStart(4, '0')}.jpg`;
      await ffmpeg.writeFile(fileName, await fetchFile(blob));
      globalFrameIndex++;
      setRenderProgress(Math.round((globalFrameIndex / totalFrames) * 100));
    }
  }

  setLoadingStatus('Encoding video...');

  const hasAudio = story.audio?.src || slidesToExport.some((slide) => slide.audio?.src);
  const audioSrc = story.audio?.src || slidesToExport.find((s) => s.audio?.src)?.audio?.src;

  if (settings.includeAudio && hasAudio && audioSrc) {
    try {
      const resolvedAudioSrc = resolveMediaUrl(audioSrc);
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 15000);
      const audioResponse = await fetch(resolvedAudioSrc, { signal: controller.signal });
      clearTimeout(fetchTimeout);

      const audioBlob = await audioResponse.blob();
      const audioBuffer = await audioBlob.arrayBuffer();
      const audioExt = audioSrc.split('.').pop()?.split('?')[0] || 'mp3';
      await ffmpeg.writeFile(`audio.${audioExt}`, new Uint8Array(audioBuffer));

      await ffmpeg.exec([
        '-framerate', String(fps),
        '-i', 'frame-%04d.jpg',
        '-i', `audio.${audioExt}`,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-shortest',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        'output.mp4',
      ]);

      await ffmpeg.deleteFile(`audio.${audioExt}`);
    } catch (audioErr) {
      console.error('Failed to add audio:', audioErr);
      await ffmpeg.exec([
        '-framerate', String(fps),
        '-i', 'frame-%04d.jpg',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        'output.mp4',
      ]);
    }
  } else {
    await ffmpeg.exec([
      '-framerate', String(fps),
      '-i', 'frame-%04d.jpg',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      'output.mp4',
    ]);
  }

  const data = await ffmpeg.readFile('output.mp4');
  const mp4Blob = new Blob([data as unknown as BlobPart], { type: 'video/mp4' });
  downloadBlob(mp4Blob, `${story.title.replace(/\s+/g, '-').toLowerCase()}_${resolution}.mp4`);

  // Cleanup
  for (let i = 0; i < globalFrameIndex; i++) {
    try {
      await ffmpeg.deleteFile(`frame-${String(i).padStart(4, '0')}.jpg`);
    } catch { /* ignore */ }
  }
  await ffmpeg.deleteFile('output.mp4');
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
