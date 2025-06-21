"use client"
import { useState } from "react"
import { Heart, MessageCircle, Share, Camera } from "lucide-react"
import AnimatedBackground from "../components/AnimatedBackground"

interface Post {
  id: number
  user: {
    name: string
    avatar: string
    username: string
  }
  image: string
  caption: string
  likes: number
  comments: number
  timestamp: string
  items: Array<{ name: string; brand: string; price: number }>
  reward: {
    views: number
    buys: number
    discount: number
    brand: string
  }
}

const posts: Post[] = [
  {
    id: 1,
    user: {
      name: "Emma Style",
      avatar: "/placeholder.svg?height=40&width=40",
      username: "@emmastyle",
    },
    image: "/placeholder.svg?height=400&width=300",
    caption: "Obsessed with this autumn vibe! 🍂✨",
    likes: 1247,
    comments: 89,
    timestamp: "2h ago",
    items: [
      { name: "Oversized Blazer", brand: "Zara", price: 89 },
      { name: "High-Waist Jeans", brand: "H&M", price: 45 },
    ],
    reward: {
      views: 3500,
      buys: 9,
      discount: 10,
      brand: "Zara",
    },
  },
  {
    id: 2,
    user: {
      name: "Alex Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      username: "@alexchen",
    },
    image: "/placeholder.svg?height=400&width=300",
    caption: "Street style vibes for the weekend 🔥",
    likes: 892,
    comments: 45,
    timestamp: "5h ago",
    items: [
      { name: "Graphic Tee", brand: "Urban Outfitters", price: 35 },
      { name: "Cargo Pants", brand: "ASOS", price: 65 },
    ],
    reward: {
      views: 2100,
      buys: 5,
      discount: 8,
      brand: "ASOS",
    },
  },
]

export default function CommunityPage() {
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())

  const handleLike = (postId: number) => {
    const newLikedPosts = new Set(likedPosts)
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId)
    } else {
      newLikedPosts.add(postId)
    }
    setLikedPosts(newLikedPosts)
  }

  return (
    <div className="min-h-screen relative pb-20">
      <AnimatedBackground />

      <div className="relative z-10">
        {/* Header */}
        <div className="p-6 pb-0">
          <h1 className="text-2xl font-bold gradient-text text-center">Community</h1>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6 p-6">
          {posts.map((post) => (
            <div key={post.id} className="glass-card rounded-3xl overflow-hidden">
              {/* Reward Banner */}
              <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 text-center">
                <p className="text-white text-sm font-semibold">
                  🎉 You earned {post.reward.discount}% off at {post.reward.brand} from{" "}
                  {post.reward.views.toLocaleString()} views and {post.reward.buys} buys!
                </p>
              </div>

              {/* User Header */}
              <div className="flex items-center gap-3 p-4 pb-2">
                <img
                  src={post.user.avatar || "/placeholder.svg"}
                  alt={post.user.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{post.user.name}</h3>
                  <p className="text-gray-400 text-sm">
                    {post.user.username} • {post.timestamp}
                  </p>
                </div>
              </div>

              {/* Post Image */}
              <div className="relative">
                <img src={post.image || "/placeholder.svg"} alt="Outfit post" className="w-full h-80 object-cover" />

                {/* Product Tags */}
                <div className="absolute bottom-4 left-4 space-y-2">
                  {post.items.map((item, index) => (
                    <button
                      key={index}
                      className="block glass-card rounded-full px-3 py-1 text-sm text-white hover:bg-white/20 transition-all duration-300"
                    >
                      {item.brand} - ${item.price}
                    </button>
                  ))}
                </div>
              </div>

              {/* Post Content */}
              <div className="p-4">
                <p className="mb-3">{post.caption}</p>

                {/* Actions */}
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 transition-all duration-300 ${
                      likedPosts.has(post.id) ? "text-red-500" : "text-gray-400 hover:text-red-500"
                    }`}
                  >
                    <Heart size={20} fill={likedPosts.has(post.id) ? "currentColor" : "none"} />
                    <span>{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
                  </button>

                  <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300">
                    <MessageCircle size={20} />
                    <span>{post.comments}</span>
                  </button>

                  <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300">
                    <Share size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="px-6 pb-6">
          <div className="glass-card rounded-2xl p-4 border border-yellow-500/30">
            <p className="text-yellow-400 text-sm">
              ⚠️ Rewards shown are illustrative. Actual discounts depend on verified performance and participating
              brands.
            </p>
          </div>
        </div>
      </div>

      {/* Create Post FAB */}
      <button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-24 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse-glow shadow-2xl z-40"
        aria-label="Create post"
      >
        <Camera className="text-white" size={24} />
      </button>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-sm glass-card rounded-3xl p-6">
            <h2 className="text-xl font-bold gradient-text text-center mb-6">Post Your Fit</h2>

            <div className="space-y-4">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-dashed border-purple-400 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="text-purple-400 mx-auto mb-2" size={32} />
                  <p className="text-gray-400 text-sm">Upload outfit image</p>
                </div>
              </div>

              <textarea
                placeholder="Caption your look..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 resize-none h-20"
              />

              <div className="glass-card rounded-xl p-4">
                <h3 className="font-semibold mb-2">Potential Reward Preview</h3>
                <p className="text-sm text-gray-300">
                  📣 If this post gets 3,000 views and 10 buys, you'll unlock 10% off at H&M!
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="flex-1 bg-white/10 text-white py-3 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
