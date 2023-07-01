import { getFirestore, doc, onSnapshot, DocumentData, DocumentReference, setDoc } from "firebase/firestore"
import { getDownloadURL, getStorage, ref } from "firebase/storage"
import { useRouter } from "next/router"
import { useCallback, useEffect, useRef, useState } from "react"
import { z } from "zod"

const watchListSchema = z.object({
  updatedAt: z.number(),
  time: z.number(),
  playing: z.boolean(),
  url: z.string(),
})

const ALLOWED_DELAY_SECONDS = 3

export type WatchList = z.infer<typeof watchListSchema>

export default function WatchPage() {
  const firestore = getFirestore()

  const router = useRouter()

  const [watchList, setWatchList] = useState<WatchList | null>(null)
  const [docRef, setDocRef] = useState<DocumentReference<DocumentData> | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!router.isReady) {
      return
    }

    const { id } = router.query
    console.log("Using id:", id)

    if (!id) {
      return
    }

    if (typeof id !== "string") {
      return
    }

    const currentDocRef = doc(firestore, "watchList", id)
    setDocRef(currentDocRef)

    const unsubscribe = onSnapshot(currentDocRef, async (doc) => {
      const newWatchList = watchListSchema.parse(doc.data())
      setWatchList(newWatchList)

      console.log("Watch list updated")
      updateVideo(newWatchList)
    })

    return () => {
      unsubscribe()
    }
  }, [router, videoRef])

  useEffect(() => {
    if (watchList === null) {
      return
    }

    if (videoRef.current === null) {
      return
    }

    updateVideo(watchList)
  }, [watchList?.updatedAt, videoRef])

  async function handlePlay() {
    if (watchList === null) {
      return
    }

    if (docRef === null) {
      return
    }

    if (videoRef.current === null) {
      return
    }

    if (videoRef.current.paused) {
      videoRef.current.play()
    }

    const updatedWatchList: WatchList = {
      ...watchList,
      time: videoRef.current.currentTime,
      playing: true,
      updatedAt: Date.now(),
    }

    setDoc(docRef, updatedWatchList)
  }

  async function handlePause() {
    if (watchList === null) {
      return
    }

    if (docRef === null) {
      return
    }

    if (videoRef.current === null) {
      return
    }

    if (!videoRef.current.paused) {
      videoRef.current.pause()
    }

    const updatedWatchList: WatchList = {
      ...watchList,
      time: videoRef.current.currentTime,
      playing: false,
      updatedAt: Date.now(),
    }

    setDoc(docRef, updatedWatchList)
  }

  // async function handleSeek() {
  //   if (watchList === null) {
  //     return
  //   }

  //   if (docRef === null) {
  //     return
  //   }

  //   if (videoRef.current === null) {
  //     return
  //   }

  //   const updatedWatchList: WatchList = {
  //     ...watchList,
  //     time: videoRef.current.currentTime,
  //     updatedAt: Date.now(),
  //   }

  //   setDoc(docRef, updatedWatchList)
  // }

  const updateVideo = useCallback(async function(watchList: WatchList) {
    const videoElement = videoRef.current

    if (videoElement === null) {
      return
    }

    if (watchList.url !== watchList?.url) {
      const storage = getStorage();
      const storageRef = ref(storage, watchList.url);

      console.log("Getting download URL")
      const url = await getDownloadURL(storageRef)
      setVideoUrl(url)
    }

    const secondsFromLastUpdate = (Date.now() - watchList.updatedAt) / 1000
    const othersTime = secondsFromLastUpdate + watchList.time
    const delayFromOthers = Math.abs(othersTime - videoElement.currentTime)

    console.log("Delay from others:", delayFromOthers)
    console.log("Update state", watchList)

    if (delayFromOthers > ALLOWED_DELAY_SECONDS) {
      videoElement.currentTime = othersTime
      if (watchList.playing) {
        console.log("Playing")
        videoElement.play()
      } else {
        videoElement.pause()
      }
    }
  }, [videoRef])

  function handleJoin() {
    if (videoRef.current === null) {
      return
    }

    if (watchList === null) {
      return
    }

    updateVideo(watchList)
  }

  return <>
    {
      videoUrl === null
        ? <p>Loading...</p>
        : <>
          <video
            src={videoUrl}
            playsInline
            ref={videoRef}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeeked={handleSeek}
          />
          <div className="flex gap-4 bg-[red]">
            <button onClick={handleJoin}>Sync</button>
            <button onClick={handlePlay}>Play</button>
            <button onClick={handlePause}>Pause</button>
          </div>
        </>
    }
  </>
}

