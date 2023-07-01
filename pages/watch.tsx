import { getFirestore, doc, onSnapshot } from "firebase/firestore"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { z } from "zod"

const watchListSchema = z.object({
  time: z.number(),
  url: z.string(),
  createdAt: z.number(),
})

export type WatchList = z.infer<typeof watchListSchema>

export default function Home() {
  const firestore = getFirestore()

  const router = useRouter()

  const [watchList, setWatchList] = useState<WatchList | null>(null)

  useEffect(() => {
    if (!router.isReady) {
      return
    }

    const { id } = router.query

    if (!id) {
      return
    }

    if (typeof id !== "string") {
      return
    }

    onSnapshot(doc(firestore, "watchList", id), (doc) => {
      const newWatchList = watchListSchema.parse(doc.data())
      setWatchList(newWatchList)
    })
  }, [])

  return <>
    {
      watchList === null
        ? <p>Loading...</p>
        : <video src={watchList.url} controls autoPlay />
    }
  </>
}

