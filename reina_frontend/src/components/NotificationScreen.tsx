import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  deleteNotification,
  deleteAllNotifications,
  markAsReadNotification,
  type Notification,
} from "../api/notificationAPI";

import { Link, useNavigate } from "react-router-dom";
import { useLoginStore } from "../Store/useLoginStore";
import { useEffect, useState } from "react";

const NotificationScreen = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken, clearTokens } = useLoginStore();

  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
    }
  }, [accessToken, navigate]);

  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
  } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isError && error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load notifications.";
      setFetchError(errorMessage);
    }
  }, [isError, error]);

  // Mutation for deleting a notification
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        console.error("Failed to delete notification:", error.message);
      } else {
        console.error("Failed to delete notification:", error);
      }
      alert("Failed to delete notification");
    },
  });

  // Mutation for deleting all notifications
  const deleteAllMutation = useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        console.error("Failed to delete all notifications:", error.message);
      } else {
        console.error("Failed to delete all notifications:", error);
      }
      alert("Failed to delete all notifications");
    },
  });

  // Mutation for marking a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: markAsReadNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        console.error("Failed to mark notification as read:", error.message);
      } else {
        console.error("Failed to mark notification as read:", error);
      }
      alert("Failed to mark notification as read");
    },
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* Error Handling */}
          {fetchError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{fetchError} Please check your connection or login again.</p>
              <button
                onClick={() => {
                  clearTokens();
                  navigate("/login");
                }}
                className="mt-2 bg-red-500 text-white p-2 rounded hover:bg-red-600"
              >
                Login Again
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <Link
              to="/dashboard"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Back to Dashboard
            </Link>
          </div>
          {isLoading ? (
            <p>Loading...</p>
          ) : notifications.length === 0 ? (
            <p>No notifications found.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((notification) => (
                <li
                  key={notification.notification_id}
                  className={`p-3 rounded-md flex justify-between items-center ${
                    notification.is_read ? "bg-gray-100" : "bg-yellow-100"
                  }`}
                >
                  <div>
                    <p className={notification.is_read ? "" : "font-semibold"}>
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-x-2">
                    {!notification.is_read && (
                      <button
                        onClick={() =>
                          markAsReadMutation.mutate(
                            notification.notification_id
                          )
                        }
                        className="bg-green-500 text-white p-1 px-3 rounded hover:bg-green-600"
                        disabled={markAsReadMutation.isPending}
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() =>
                        deleteMutation.mutate(notification.notification_id)
                      }
                      className="bg-red-500 text-white p-1 px-3 rounded hover:bg-red-600"
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2 mt-3">
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete all notifications?"
                    )
                  ) {
                    deleteAllMutation.mutate();
                  }
                }}
                className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                disabled={deleteAllMutation.isPending}
              >
                Delete All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationScreen;
