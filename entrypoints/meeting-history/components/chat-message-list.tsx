import type { SavedChatMessage } from "./types";

type Props = {
  messages: SavedChatMessage[];
};

type MessageGroup = {
  id: string;
  author: string;
  time: string;
  messages: SavedChatMessage[];
};

const normalizeTime = (time: string): string =>
  time.trim().replace(/\s+/g, " ").toLocaleLowerCase();

const groupMessages = (messages: SavedChatMessage[]): MessageGroup[] => {
  const groups: MessageGroup[] = [];

  messages.forEach((message) => {
    const previousGroup = groups.at(-1);
    if (
      previousGroup?.author === message.author &&
      normalizeTime(previousGroup.time) === normalizeTime(message.time)
    ) {
      previousGroup.messages.push(message);
      return;
    }

    groups.push({
      id: message.id,
      author: message.author,
      time: message.time,
      messages: [message],
    });
  });

  return groups;
};

export const ChatMessageList = ({ messages }: Props) => {
  const groups = groupMessages(messages);

  return (
    <section
      className="mt-6 w-full overflow-hidden rounded-xl border border-(--mc-app-border) bg-(--mc-app-surface)"
      style={{ maxWidth: "100%" }}
    >
      <div className="border-b border-(--mc-app-border) bg-(--mc-app-surface-solid)">
        <div className="w-full pl-5 py-4">
          <h3 className="text-lg leading-5 font-medium text-(--mc-app-text)">Meeting chat</h3>
        </div>
      </div>
      {groups.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-(--mc-app-text-secondary)">
          No meeting chat
        </p>
      ) : (
        <ol className="flex w-full flex-col px-5 py-5" style={{ gap: "20px" }}>
          {groups.map((group) => {
            const isOwnGroup = group.author === "You";

            return (
              <li
                key={group.id}
                className={`flex ${isOwnGroup ? "justify-end" : "justify-start"}`}
              >
                <div className="min-w-0 max-w-[80%]">
                  <div
                    className={`mb-1.5 flex items-baseline gap-2 ${
                      isOwnGroup ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-200">
                      {group.author}
                    </span>
                    <time className="text-xs text-slate-500">{group.time}</time>
                  </div>
                  <div
                    className={`flex flex-col gap-1.5 ${
                      isOwnGroup ? "items-end" : "items-start"
                    }`}
                  >
                    {group.messages.map((message) => (
                      <p
                        key={message.id}
                        className={`w-fit max-w-full rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-slate-100 ${
                          isOwnGroup
                            ? "rounded-tr-md bg-blue-600/80"
                            : "rounded-tl-md bg-(--mc-secondary)"
                        }`}
                      >
                        {message.text}
                      </p>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
