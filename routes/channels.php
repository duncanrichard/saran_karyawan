<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('management.notifications', function ($user) {
    return $user->is_active
        && $user->hasAnyRole(['management', 'super_admin'])
        && $user->can('ticket.view');
});
