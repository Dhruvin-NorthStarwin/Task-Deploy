# Video Preview Components Usage Guide

This application includes video preview functionality using `react-player` and custom components to display videos from the database.

## Components Available

### 1. VideoPreview
A basic video player component for displaying videos from URLs.

```tsx
import VideoPreview from '../components/common/VideoPreview';

// Basic usage
<VideoPreview
  videoUrl="https://example.com/video.mp4"
  width="100%"
  height="400px"
  controls={true}
  autoplay={false}
  onError={(error) => console.error('Video error:', error)}
  onReady={() => console.log('Video ready')}
/>
```

### 2. TaskVideoPlayer
A component that automatically fetches and displays video for a specific task from the database.

```tsx
import TaskVideoPlayer from '../components/common/TaskVideoPlayer';

// Fetch and display video for task ID 123
<TaskVideoPlayer
  taskId={123}
  width="100%"
  height="300px"
  controls={true}
  onVideoError={(error) => console.error('Video error:', error)}
  onVideoReady={() => console.log('Video loaded')}
/>
```

## API Integration

### Fetching Video URL for a Task

```tsx
import { getTaskVideoUrl } from '../services/apiService';

const fetchVideo = async (taskId: number) => {
  try {
    const videoUrl = await getTaskVideoUrl(taskId);
    if (videoUrl) {
      console.log('Video URL:', videoUrl);
      // Use the URL with VideoPreview component
    } else {
      console.log('No video found for task');
    }
  } catch (error) {
    console.error('Error fetching video:', error);
  }
};
```

## Integration Examples

### In Task Cards
```tsx
// Show video thumbnail in task card
{task.videoRequired && task.videoUrl && (
  <div className="mt-2">
    <VideoPreview
      videoUrl={task.videoUrl}
      width="100%"
      height="150px"
      controls={false}
      className="rounded border"
    />
  </div>
)}
```

### In Modal/Detail Views
```tsx
// Full video player in task detail modal
{task.videoUrl && (
  <div className="mb-4">
    <h4 className="text-lg font-semibold mb-2">Task Video</h4>
    <VideoPreview
      videoUrl={task.videoUrl}
      width="100%"
      height="400px"
      controls={true}
      autoplay={false}
    />
  </div>
)}
```

### Dynamic Loading by Task ID
```tsx
// Load video dynamically for any task
const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

{selectedTaskId && (
  <TaskVideoPlayer
    taskId={selectedTaskId}
    width="800px"
    height="450px"
    controls={true}
  />
)}
```

## Features

- **Error Handling**: Displays error states with retry functionality
- **Loading States**: Shows loading indicators while fetching
- **Responsive**: Adapts to different screen sizes
- **Cross-Origin Support**: Handles CORS issues automatically
- **Multiple Formats**: Supports various video formats via react-player
- **Database Integration**: Automatically fetches video URLs from your backend

## Styling

All components use Tailwind CSS classes and can be customized with the `className` prop:

```tsx
<VideoPreview
  videoUrl={videoUrl}
  className="shadow-lg border-2 border-blue-500 rounded-xl"
  width="100%"
  height="300px"
/>
```

## Performance Notes

- Videos are loaded on-demand
- The VideoPreview component includes loading states to improve UX
- Error states allow users to retry failed loads
- TaskVideoPlayer caches the video URL to prevent unnecessary API calls
