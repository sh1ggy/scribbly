#![allow(warnings)]

use bebop::FixedSized as _;
use core::convert::TryInto as _;
use std::io::Write as _;

#[repr(u32)]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Stage {
    GamerSelect = 1,
    AudienceLobby = 2,
    Drawing = 3,
    Voting = 4,
    Judging = 5,
    Results = 6,
}

impl ::core::convert::TryFrom<u32> for Stage {
    type Error = ::bebop::DeserializeError;

    fn try_from(value: u32) -> ::bebop::DeResult<Self> {
        match value {
            1 => Ok(Stage::GamerSelect),
            2 => Ok(Stage::AudienceLobby),
            3 => Ok(Stage::Drawing),
            4 => Ok(Stage::Voting),
            5 => Ok(Stage::Judging),
            6 => Ok(Stage::Results),
            d => Err(::bebop::DeserializeError::InvalidEnumDiscriminator(
                d.into(),
            )),
        }
    }
}

impl ::core::convert::From<Stage> for u32 {
    fn from(value: Stage) -> Self {
        match value {
            Stage::GamerSelect => 1,
            Stage::AudienceLobby => 2,
            Stage::Drawing => 3,
            Stage::Voting => 4,
            Stage::Judging => 5,
            Stage::Results => 6,
        }
    }
}

impl ::bebop::SubRecord<'_> for Stage {
    const MIN_SERIALIZED_SIZE: usize = ::std::mem::size_of::<u32>();
    const EXACT_SERIALIZED_SIZE: Option<usize> = Some(::std::mem::size_of::<u32>());

    #[inline]
    fn serialized_size(&self) -> usize {
        ::std::mem::size_of::<u32>()
    }

    ::bebop::define_serialize_chained!(*Self => |zelf, dest| {
        u32::from(zelf)._serialize_chained(dest)
    });

    #[inline]
    fn _deserialize_chained(raw: &[u8]) -> ::bebop::DeResult<(usize, Self)> {
        let (n, v) = u32::_deserialize_chained(raw)?;
        Ok((n, v.try_into()?))
    }
}

impl ::bebop::FixedSized for Stage {
    const SERIALIZED_SIZE: usize = ::std::mem::size_of::<u32>();
}

#[repr(u32)]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ServerMessageType {
    Ping = 1,
    GameState = 2,
    ClientTypeDTO = 3,
    ClientJoined = 4,
    DrawUpdate = 5,
    FinishStroke = 6,
    VoteUpdate = 7,
    Clear = 8,
    STgNew = 28,
    STgAudienceLobby = 29,
    STgDrawing = 30,
    STgVoting = 31,
    STgJudging = 32,
    STgResults = 33,
}

impl ::core::convert::TryFrom<u32> for ServerMessageType {
    type Error = ::bebop::DeserializeError;

    fn try_from(value: u32) -> ::bebop::DeResult<Self> {
        match value {
            1 => Ok(ServerMessageType::Ping),
            2 => Ok(ServerMessageType::GameState),
            3 => Ok(ServerMessageType::ClientTypeDTO),
            4 => Ok(ServerMessageType::ClientJoined),
            5 => Ok(ServerMessageType::DrawUpdate),
            6 => Ok(ServerMessageType::FinishStroke),
            7 => Ok(ServerMessageType::VoteUpdate),
            8 => Ok(ServerMessageType::Clear),
            28 => Ok(ServerMessageType::STgNew),
            29 => Ok(ServerMessageType::STgAudienceLobby),
            30 => Ok(ServerMessageType::STgDrawing),
            31 => Ok(ServerMessageType::STgVoting),
            32 => Ok(ServerMessageType::STgJudging),
            33 => Ok(ServerMessageType::STgResults),
            d => Err(::bebop::DeserializeError::InvalidEnumDiscriminator(
                d.into(),
            )),
        }
    }
}

impl ::core::convert::From<ServerMessageType> for u32 {
    fn from(value: ServerMessageType) -> Self {
        match value {
            ServerMessageType::Ping => 1,
            ServerMessageType::GameState => 2,
            ServerMessageType::ClientTypeDTO => 3,
            ServerMessageType::ClientJoined => 4,
            ServerMessageType::DrawUpdate => 5,
            ServerMessageType::FinishStroke => 6,
            ServerMessageType::VoteUpdate => 7,
            ServerMessageType::Clear => 8,
            ServerMessageType::STgNew => 28,
            ServerMessageType::STgAudienceLobby => 29,
            ServerMessageType::STgDrawing => 30,
            ServerMessageType::STgVoting => 31,
            ServerMessageType::STgJudging => 32,
            ServerMessageType::STgResults => 33,
        }
    }
}

impl ::bebop::SubRecord<'_> for ServerMessageType {
    const MIN_SERIALIZED_SIZE: usize = ::std::mem::size_of::<u32>();
    const EXACT_SERIALIZED_SIZE: Option<usize> = Some(::std::mem::size_of::<u32>());

    #[inline]
    fn serialized_size(&self) -> usize {
        ::std::mem::size_of::<u32>()
    }

    ::bebop::define_serialize_chained!(*Self => |zelf, dest| {
        u32::from(zelf)._serialize_chained(dest)
    });

    #[inline]
    fn _deserialize_chained(raw: &[u8]) -> ::bebop::DeResult<(usize, Self)> {
        let (n, v) = u32::_deserialize_chained(raw)?;
        Ok((n, v.try_into()?))
    }
}

impl ::bebop::FixedSized for ServerMessageType {
    const SERIALIZED_SIZE: usize = ::std::mem::size_of::<u32>();
}

#[derive(Clone, Debug, PartialEq, Copy)]
#[repr(packed)]
pub struct DrawUpdate {
    pub cursor: CursorLocation,
    pub gamer: GamerChoice,
}

impl ::bebop::FixedSized for DrawUpdate {}

impl<'raw> ::bebop::SubRecord<'raw> for DrawUpdate {
    const MIN_SERIALIZED_SIZE: usize = Self::SERIALIZED_SIZE;
    const EXACT_SERIALIZED_SIZE: Option<usize> = Some(Self::SERIALIZED_SIZE);

    #[inline]
    fn serialized_size(&self) -> usize {
        Self::SERIALIZED_SIZE
    }

    ::bebop::define_serialize_chained!(*Self => |zelf, dest| {
        Ok(
            ::bebop::packed_read!(zelf.cursor)._serialize_chained(dest)? +
            ::bebop::packed_read!(zelf.gamer)._serialize_chained(dest)?
        )
    });

    fn _deserialize_chained(raw: &'raw [u8]) -> ::bebop::DeResult<(usize, Self)> {
        let mut i = 0;
        if raw.len() - i < Self::MIN_SERIALIZED_SIZE {
            let missing = Self::MIN_SERIALIZED_SIZE - (raw.len() - i);
            return Err(::bebop::DeserializeError::MoreDataExpected(missing));
        }

        let (read, v0) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
        i += read;
        let (read, v1) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
        i += read;

        Ok((
            i,
            Self {
                cursor: v0,
                gamer: v1,
            },
        ))
    }
}

impl<'raw> ::bebop::Record<'raw> for DrawUpdate {}

#[derive(Clone, Debug, PartialEq)]
pub struct GameState<'raw> {
    pub id: ::bebop::Guid,
    pub stage: Stage,
    pub clients: ::bebop::SliceWrapper<'raw, ClientType>,
    pub drawing: ::std::vec::Vec<Stroke<'raw>>,
}

impl<'raw> ::bebop::SubRecord<'raw> for GameState<'raw> {
    const MIN_SERIALIZED_SIZE: usize = <::bebop::Guid>::MIN_SERIALIZED_SIZE
        + <Stage>::MIN_SERIALIZED_SIZE
        + <::bebop::SliceWrapper<'raw, ClientType>>::MIN_SERIALIZED_SIZE
        + <::std::vec::Vec<Stroke<'raw>>>::MIN_SERIALIZED_SIZE;

    #[inline]
    fn serialized_size(&self) -> usize {
        self.id.serialized_size()
            + self.stage.serialized_size()
            + self.clients.serialized_size()
            + self.drawing.serialized_size()
    }

    ::bebop::define_serialize_chained!(Self => |zelf, dest| {
        Ok(
            zelf.id._serialize_chained(dest)? +
            zelf.stage._serialize_chained(dest)? +
            zelf.clients._serialize_chained(dest)? +
            zelf.drawing._serialize_chained(dest)?
        )
    });

    fn _deserialize_chained(raw: &'raw [u8]) -> ::bebop::DeResult<(usize, Self)> {
        let mut i = 0;
        if raw.len() - i < Self::MIN_SERIALIZED_SIZE {
            let missing = Self::MIN_SERIALIZED_SIZE - (raw.len() - i);
            return Err(::bebop::DeserializeError::MoreDataExpected(missing));
        }

        let (read, v0) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
        i += read;
        let (read, v1) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
        i += read;
        let (read, v2) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
        i += read;
        let (read, v3) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
        i += read;

        Ok((
            i,
            Self {
                id: v0,
                stage: v1,
                clients: v2,
                drawing: v3,
            },
        ))
    }
}

impl<'raw> ::bebop::Record<'raw> for GameState<'raw> {}

#[derive(Clone, Debug, PartialEq)]
pub struct Stroke<'raw> {
    pub locs: ::bebop::SliceWrapper<'raw, CursorLocation>,
}

impl<'raw> ::bebop::SubRecord<'raw> for Stroke<'raw> {
    const MIN_SERIALIZED_SIZE: usize =
        <::bebop::SliceWrapper<'raw, CursorLocation>>::MIN_SERIALIZED_SIZE;

    #[inline]
    fn serialized_size(&self) -> usize {
        self.locs.serialized_size()
    }

    ::bebop::define_serialize_chained!(Self => |zelf, dest| {
        Ok(
            zelf.locs._serialize_chained(dest)?
        )
    });

    fn _deserialize_chained(raw: &'raw [u8]) -> ::bebop::DeResult<(usize, Self)> {
        let mut i = 0;
        if raw.len() - i < Self::MIN_SERIALIZED_SIZE {
            let missing = Self::MIN_SERIALIZED_SIZE - (raw.len() - i);
            return Err(::bebop::DeserializeError::MoreDataExpected(missing));
        }

        let (read, v0) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
        i += read;

        Ok((i, Self { locs: v0 }))
    }
}

impl<'raw> ::bebop::Record<'raw> for Stroke<'raw> {}

#[derive(Clone, Debug, PartialEq, Copy)]
#[repr(packed)]
pub struct ClientJoined {
    pub new_client: ClientType,
}

impl ::bebop::FixedSized for ClientJoined {}

impl<'raw> ::bebop::SubRecord<'raw> for ClientJoined {
    const MIN_SERIALIZED_SIZE: usize = Self::SERIALIZED_SIZE;
    const EXACT_SERIALIZED_SIZE: Option<usize> = Some(Self::SERIALIZED_SIZE);

    #[inline]
    fn serialized_size(&self) -> usize {
        Self::SERIALIZED_SIZE
    }

    ::bebop::define_serialize_chained!(*Self => |zelf, dest| {
        Ok(
            ::bebop::packed_read!(zelf.new_client)._serialize_chained(dest)?
        )
    });

    fn _deserialize_chained(raw: &'raw [u8]) -> ::bebop::DeResult<(usize, Self)> {
        let mut i = 0;
        if raw.len() - i < Self::MIN_SERIALIZED_SIZE {
            let missing = Self::MIN_SERIALIZED_SIZE - (raw.len() - i);
            return Err(::bebop::DeserializeError::MoreDataExpected(missing));
        }

        let (read, v0) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
        i += read;

        Ok((i, Self { new_client: v0 }))
    }
}

impl<'raw> ::bebop::Record<'raw> for ClientJoined {}

#[derive(Clone, Debug, PartialEq, Copy)]
#[repr(packed)]
pub struct STgNew {
    pub id: ::bebop::Guid,
}

impl ::bebop::FixedSized for STgNew {}

impl<'raw> ::bebop::SubRecord<'raw> for STgNew {
    const MIN_SERIALIZED_SIZE: usize = Self::SERIALIZED_SIZE;
    const EXACT_SERIALIZED_SIZE: Option<usize> = Some(Self::SERIALIZED_SIZE);

    #[inline]
    fn serialized_size(&self) -> usize {
        Self::SERIALIZED_SIZE
    }

    ::bebop::define_serialize_chained!(*Self => |zelf, dest| {
        Ok(
            ::bebop::packed_read!(zelf.id)._serialize_chained(dest)?
        )
    });

    fn _deserialize_chained(raw: &'raw [u8]) -> ::bebop::DeResult<(usize, Self)> {
        let mut i = 0;
        if raw.len() - i < Self::MIN_SERIALIZED_SIZE {
            let missing = Self::MIN_SERIALIZED_SIZE - (raw.len() - i);
            return Err(::bebop::DeserializeError::MoreDataExpected(missing));
        }

        let (read, v0) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
        i += read;

        Ok((i, Self { id: v0 }))
    }
}

impl<'raw> ::bebop::Record<'raw> for STgNew {}

#[derive(Clone, Debug, PartialEq, Copy)]
#[repr(packed)]
pub struct Clear {
    pub gamer: GamerChoice,
}

impl ::bebop::FixedSized for Clear {}

impl<'raw> ::bebop::SubRecord<'raw> for Clear {
    const MIN_SERIALIZED_SIZE: usize = Self::SERIALIZED_SIZE;
    const EXACT_SERIALIZED_SIZE: Option<usize> = Some(Self::SERIALIZED_SIZE);

    #[inline]
    fn serialized_size(&self) -> usize {
        Self::SERIALIZED_SIZE
    }

    ::bebop::define_serialize_chained!(*Self => |zelf, dest| {
        Ok(
            ::bebop::packed_read!(zelf.gamer)._serialize_chained(dest)?
        )
    });

    fn _deserialize_chained(raw: &'raw [u8]) -> ::bebop::DeResult<(usize, Self)> {
        let mut i = 0;
        if raw.len() - i < Self::MIN_SERIALIZED_SIZE {
            let missing = Self::MIN_SERIALIZED_SIZE - (raw.len() - i);
            return Err(::bebop::DeserializeError::MoreDataExpected(missing));
        }

        let (read, v0) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
        i += read;

        Ok((i, Self { gamer: v0 }))
    }
}

impl<'raw> ::bebop::Record<'raw> for Clear {}

#[derive(Clone, Debug, PartialEq, Copy)]
#[repr(packed)]
pub struct STgResults {
    pub id: ::bebop::Guid,
}

impl ::bebop::FixedSized for STgResults {}

impl<'raw> ::bebop::SubRecord<'raw> for STgResults {
    const MIN_SERIALIZED_SIZE: usize = Self::SERIALIZED_SIZE;
    const EXACT_SERIALIZED_SIZE: Option<usize> = Some(Self::SERIALIZED_SIZE);

    #[inline]
    fn serialized_size(&self) -> usize {
        Self::SERIALIZED_SIZE
    }

    ::bebop::define_serialize_chained!(*Self => |zelf, dest| {
        Ok(
            ::bebop::packed_read!(zelf.id)._serialize_chained(dest)?
        )
    });

    fn _deserialize_chained(raw: &'raw [u8]) -> ::bebop::DeResult<(usize, Self)> {
        let mut i = 0;
        if raw.len() - i < Self::MIN_SERIALIZED_SIZE {
            let missing = Self::MIN_SERIALIZED_SIZE - (raw.len() - i);
            return Err(::bebop::DeserializeError::MoreDataExpected(missing));
        }

        let (read, v0) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
        i += read;

        Ok((i, Self { id: v0 }))
    }
}

impl<'raw> ::bebop::Record<'raw> for STgResults {}

pub const AUDIENCE_LOBBY_TIME: u32 = 30000;

pub const DRAWING_TIME: u32 = 60000;

#[derive(Clone, Debug, PartialEq, Copy)]
#[repr(packed)]
pub struct Coord {
    pub x: u32,
    pub y: u32,
}

impl ::bebop::FixedSized for Coord {}

impl<'raw> ::bebop::SubRecord<'raw> for Coord {
    const MIN_SERIALIZED_SIZE: usize = Self::SERIALIZED_SIZE;
    const EXACT_SERIALIZED_SIZE: Option<usize> = Some(Self::SERIALIZED_SIZE);

    #[inline]
    fn serialized_size(&self) -> usize {
        Self::SERIALIZED_SIZE
    }

    ::bebop::define_serialize_chained!(*Self => |zelf, dest| {
        Ok(
            ::bebop::packed_read!(zelf.x)._serialize_chained(dest)? +
            ::bebop::packed_read!(zelf.y)._serialize_chained(dest)?
        )
    });

    fn _deserialize_chained(raw: &'raw [u8]) -> ::bebop::DeResult<(usize, Self)> {
        let mut i = 0;
        if raw.len() - i < Self::MIN_SERIALIZED_SIZE {
            let missing = Self::MIN_SERIALIZED_SIZE - (raw.len() - i);
            return Err(::bebop::DeserializeError::MoreDataExpected(missing));
        }

        let (read, v0) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
        i += read;
        let (read, v1) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
        i += read;

        Ok((i, Self { x: v0, y: v1 }))
    }
}

impl<'raw> ::bebop::Record<'raw> for Coord {}

#[derive(Clone, Debug, PartialEq, Copy)]
#[repr(packed)]
pub struct CursorLocation {
    pub current_point: Coord,
}

impl ::bebop::FixedSized for CursorLocation {}

impl<'raw> ::bebop::SubRecord<'raw> for CursorLocation {
    const MIN_SERIALIZED_SIZE: usize = Self::SERIALIZED_SIZE;
    const EXACT_SERIALIZED_SIZE: Option<usize> = Some(Self::SERIALIZED_SIZE);

    #[inline]
    fn serialized_size(&self) -> usize {
        Self::SERIALIZED_SIZE
    }

    ::bebop::define_serialize_chained!(*Self => |zelf, dest| {
        Ok(
            ::bebop::packed_read!(zelf.current_point)._serialize_chained(dest)?
        )
    });

    fn _deserialize_chained(raw: &'raw [u8]) -> ::bebop::DeResult<(usize, Self)> {
        let mut i = 0;
        if raw.len() - i < Self::MIN_SERIALIZED_SIZE {
            let missing = Self::MIN_SERIALIZED_SIZE - (raw.len() - i);
            return Err(::bebop::DeserializeError::MoreDataExpected(missing));
        }

        let (read, v0) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
        i += read;

        Ok((i, Self { current_point: v0 }))
    }
}

impl<'raw> ::bebop::Record<'raw> for CursorLocation {}

#[repr(u32)]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum GamerChoice {
    GamerA = 1,
    GamerB = 2,
    Neither = 3,
}

impl ::core::convert::TryFrom<u32> for GamerChoice {
    type Error = ::bebop::DeserializeError;

    fn try_from(value: u32) -> ::bebop::DeResult<Self> {
        match value {
            1 => Ok(GamerChoice::GamerA),
            2 => Ok(GamerChoice::GamerB),
            3 => Ok(GamerChoice::Neither),
            d => Err(::bebop::DeserializeError::InvalidEnumDiscriminator(
                d.into(),
            )),
        }
    }
}

impl ::core::convert::From<GamerChoice> for u32 {
    fn from(value: GamerChoice) -> Self {
        match value {
            GamerChoice::GamerA => 1,
            GamerChoice::GamerB => 2,
            GamerChoice::Neither => 3,
        }
    }
}

impl ::bebop::SubRecord<'_> for GamerChoice {
    const MIN_SERIALIZED_SIZE: usize = ::std::mem::size_of::<u32>();
    const EXACT_SERIALIZED_SIZE: Option<usize> = Some(::std::mem::size_of::<u32>());

    #[inline]
    fn serialized_size(&self) -> usize {
        ::std::mem::size_of::<u32>()
    }

    ::bebop::define_serialize_chained!(*Self => |zelf, dest| {
        u32::from(zelf)._serialize_chained(dest)
    });

    #[inline]
    fn _deserialize_chained(raw: &[u8]) -> ::bebop::DeResult<(usize, Self)> {
        let (n, v) = u32::_deserialize_chained(raw)?;
        Ok((n, v.try_into()?))
    }
}

impl ::bebop::FixedSized for GamerChoice {
    const SERIALIZED_SIZE: usize = ::std::mem::size_of::<u32>();
}

#[repr(u32)]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ClientType {
    Gamer = 1,
    Audience = 2,
    Admin = 3,
    Unknown = 4,
}

impl ::core::convert::TryFrom<u32> for ClientType {
    type Error = ::bebop::DeserializeError;

    fn try_from(value: u32) -> ::bebop::DeResult<Self> {
        match value {
            1 => Ok(ClientType::Gamer),
            2 => Ok(ClientType::Audience),
            3 => Ok(ClientType::Admin),
            4 => Ok(ClientType::Unknown),
            d => Err(::bebop::DeserializeError::InvalidEnumDiscriminator(
                d.into(),
            )),
        }
    }
}

impl ::core::convert::From<ClientType> for u32 {
    fn from(value: ClientType) -> Self {
        match value {
            ClientType::Gamer => 1,
            ClientType::Audience => 2,
            ClientType::Admin => 3,
            ClientType::Unknown => 4,
        }
    }
}

impl ::bebop::SubRecord<'_> for ClientType {
    const MIN_SERIALIZED_SIZE: usize = ::std::mem::size_of::<u32>();
    const EXACT_SERIALIZED_SIZE: Option<usize> = Some(::std::mem::size_of::<u32>());

    #[inline]
    fn serialized_size(&self) -> usize {
        ::std::mem::size_of::<u32>()
    }

    ::bebop::define_serialize_chained!(*Self => |zelf, dest| {
        u32::from(zelf)._serialize_chained(dest)
    });

    #[inline]
    fn _deserialize_chained(raw: &[u8]) -> ::bebop::DeResult<(usize, Self)> {
        let (n, v) = u32::_deserialize_chained(raw)?;
        Ok((n, v.try_into()?))
    }
}

impl ::bebop::FixedSized for ClientType {
    const SERIALIZED_SIZE: usize = ::std::mem::size_of::<u32>();
}

#[cfg(feature = "bebop-owned-all")]
pub mod owned {
    #![allow(warnings)]

    use bebop::FixedSized as _;
    use core::convert::TryInto as _;
    use std::io::Write as _;

    pub use super::Stage;

    pub use super::ServerMessageType;

    pub use super::DrawUpdate;

    #[derive(Clone, Debug, PartialEq)]
    pub struct GameState {
        pub id: ::bebop::Guid,
        pub stage: Stage,
        pub clients: ::std::vec::Vec<ClientType>,
        pub drawing: ::std::vec::Vec<Stroke>,
    }

    impl<'raw> ::core::convert::From<super::GameState<'raw>> for GameState {
        fn from(value: super::GameState) -> Self {
            Self {
                id: value.id,
                stage: value.stage,
                clients: value.clients.iter().map(|value| value).collect(),
                drawing: value
                    .drawing
                    .into_iter()
                    .map(|value| value.into())
                    .collect(),
            }
        }
    }

    impl<'raw> ::bebop::SubRecord<'raw> for GameState {
        const MIN_SERIALIZED_SIZE: usize = <::bebop::Guid>::MIN_SERIALIZED_SIZE
            + <Stage>::MIN_SERIALIZED_SIZE
            + <::std::vec::Vec<ClientType>>::MIN_SERIALIZED_SIZE
            + <::std::vec::Vec<Stroke>>::MIN_SERIALIZED_SIZE;

        #[inline]
        fn serialized_size(&self) -> usize {
            self.id.serialized_size()
                + self.stage.serialized_size()
                + self.clients.serialized_size()
                + self.drawing.serialized_size()
        }

        ::bebop::define_serialize_chained!(Self => |zelf, dest| {
            Ok(
                zelf.id._serialize_chained(dest)? +
                zelf.stage._serialize_chained(dest)? +
                zelf.clients._serialize_chained(dest)? +
                zelf.drawing._serialize_chained(dest)?
            )
        });

        fn _deserialize_chained(raw: &'raw [u8]) -> ::bebop::DeResult<(usize, Self)> {
            let mut i = 0;
            if raw.len() - i < Self::MIN_SERIALIZED_SIZE {
                let missing = Self::MIN_SERIALIZED_SIZE - (raw.len() - i);
                return Err(::bebop::DeserializeError::MoreDataExpected(missing));
            }

            let (read, v0) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
            i += read;
            let (read, v1) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
            i += read;
            let (read, v2) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
            i += read;
            let (read, v3) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
            i += read;

            Ok((
                i,
                Self {
                    id: v0,
                    stage: v1,
                    clients: v2,
                    drawing: v3,
                },
            ))
        }
    }

    impl<'raw> ::bebop::Record<'raw> for GameState {}

    #[derive(Clone, Debug, PartialEq)]
    pub struct Stroke {
        pub locs: ::std::vec::Vec<CursorLocation>,
    }

    impl<'raw> ::core::convert::From<super::Stroke<'raw>> for Stroke {
        fn from(value: super::Stroke) -> Self {
            Self {
                locs: value.locs.iter().map(|value| value).collect(),
            }
        }
    }

    impl<'raw> ::bebop::SubRecord<'raw> for Stroke {
        const MIN_SERIALIZED_SIZE: usize = <::std::vec::Vec<CursorLocation>>::MIN_SERIALIZED_SIZE;

        #[inline]
        fn serialized_size(&self) -> usize {
            self.locs.serialized_size()
        }

        ::bebop::define_serialize_chained!(Self => |zelf, dest| {
            Ok(
                zelf.locs._serialize_chained(dest)?
            )
        });

        fn _deserialize_chained(raw: &'raw [u8]) -> ::bebop::DeResult<(usize, Self)> {
            let mut i = 0;
            if raw.len() - i < Self::MIN_SERIALIZED_SIZE {
                let missing = Self::MIN_SERIALIZED_SIZE - (raw.len() - i);
                return Err(::bebop::DeserializeError::MoreDataExpected(missing));
            }

            let (read, v0) = ::bebop::SubRecord::_deserialize_chained(&raw[i..])?;
            i += read;

            Ok((i, Self { locs: v0 }))
        }
    }

    impl<'raw> ::bebop::Record<'raw> for Stroke {}

    pub use super::ClientJoined;

    pub use super::STgNew;

    pub use super::Clear;

    pub use super::STgResults;

    pub use super::AUDIENCE_LOBBY_TIME;

    pub use super::DRAWING_TIME;

    pub use super::Coord;

    pub use super::CursorLocation;

    pub use super::GamerChoice;

    pub use super::ClientType;
}
