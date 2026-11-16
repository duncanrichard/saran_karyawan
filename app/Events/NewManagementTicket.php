<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewManagementTicket implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        /** @var array<int, string> */
        public readonly array $recipientIds,
    ) {}

    public function broadcastOn(): array
    {
        return array_map(
            fn (string $userId) => new PrivateChannel("App.Models.User.{$userId}"),
            $this->recipientIds,
        );
    }

    public function broadcastAs(): string
    {
        return 'ticket.created';
    }
}
