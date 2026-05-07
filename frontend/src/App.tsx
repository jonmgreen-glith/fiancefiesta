import { useEffect, useRef } from "react";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Track,
} from "livekit-client";

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

function App() {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const room = new Room();

    const connectToRoom = async () => {
      try {
        // Request token from backend
        const response = await fetch(`${import.meta.env.VITE_API_URL}/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomName: "jon-fiance-room",
            participantName: `user-${Math.floor(Math.random() * 1000)}`,
          }),
        });

        const data = await response.json();

        if (!data.token) {
          throw new Error("No token returned from backend");
        }

        // Connect to LiveKit
        await room.connect(LIVEKIT_URL, data.token);

        console.log("Connected to room");

        // Enable camera + microphone
        await room.localParticipant.enableCameraAndMicrophone();

        console.log("Camera and microphone enabled");

        // Attach local video track
        const localTracks = room.localParticipant.videoTrackPublications;

        localTracks.forEach((publication) => {
          const track = publication.track;

          if (
            track &&
            track.kind === Track.Kind.Video &&
            localVideoRef.current
          ) {
            track.attach(localVideoRef.current);
          }
        });

        // Listen for remote participant tracks
        room.on(
          RoomEvent.TrackSubscribed,
          (
            track: RemoteTrack,
            _publication: RemoteTrackPublication,
            participant: RemoteParticipant
          ) => {
            console.log(
              `Subscribed to ${track.kind} track from ${participant.identity}`
            );

            if (
              track.kind === Track.Kind.Video &&
              remoteVideoRef.current
            ) {
              track.attach(remoteVideoRef.current);
            }
          }
        );
      } catch (err) {
        console.error("Failed to connect:", err);
      }
    };

    connectToRoom();

    return () => {
      room.disconnect();
    };
  }, []);

  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center gap-4 p-4">
      <div className="text-white text-2xl mb-4">
        LiveKit Video Test
      </div>

      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-w-2xl rounded-xl border border-white"
      />

      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full max-w-2xl rounded-xl border border-white"
      />
    </div>
  );
}

export default App;