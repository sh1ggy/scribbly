#![allow(warnings)]

use bebop::FixedSized as _;
use core::convert::TryInto as _;
use std::io::Write as _;

#[repr(u32)]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ClientMessageType {
    Ping = 1,
    CursorLocation = 2,
    FinishStroke = 3,
    Clear = 4,
    Vote = 15,
    ADmStageChange = 26,
    ADmStart = 27,
    ADmEnd = 28,
}

impl ::core::convert::TryFrom<u32> for ClientMessageType {
    type Error = ::bebop::DeserializeError;

    fn try_from(value: u32) -> ::bebop::DeResult<Self> {
        match value {
            1 => Ok(ClientMessageType::Ping),
            2 => Ok(ClientMessageType::CursorLocation),
            3 => Ok(ClientMessageType::FinishStroke),
            4 => Ok(ClientMessageType::Clear),
            15 => Ok(ClientMessageType::Vote),
            26 => Ok(ClientMessageType::ADmStageChange),
            27 => Ok(ClientMessageType::ADmStart),
            28 => Ok(ClientMessageType::ADmEnd),
            d => Err(::bebop::DeserializeError::InvalidEnumDiscriminator(
                d.into(),
            )),
        }
    }
}

impl ::core::convert::From<ClientMessageType> for u32 {
    fn from(value: ClientMessageType) -> Self {
        match value {
            ClientMessageType::Ping => 1,
            ClientMessageType::CursorLocation => 2,
            ClientMessageType::FinishStroke => 3,
            ClientMessageType::Clear => 4,
            ClientMessageType::Vote => 15,
            ClientMessageType::ADmStageChange => 26,
            ClientMessageType::ADmStart => 27,
            ClientMessageType::ADmEnd => 28,
        }
    }
}

impl ::bebop::SubRecord<'_> for ClientMessageType {
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

impl ::bebop::FixedSized for ClientMessageType {
    const SERIALIZED_SIZE: usize = ::std::mem::size_of::<u32>();
}

#[derive(Clone, Debug, PartialEq, Copy)]
#[repr(packed)]
pub struct Vote {
    pub choice: GamerChoice,
}

impl ::bebop::FixedSized for Vote {}

impl<'raw> ::bebop::SubRecord<'raw> for Vote {
    const MIN_SERIALIZED_SIZE: usize = Self::SERIALIZED_SIZE;
    const EXACT_SERIALIZED_SIZE: Option<usize> = Some(Self::SERIALIZED_SIZE);

    #[inline]
    fn serialized_size(&self) -> usize {
        Self::SERIALIZED_SIZE
    }

    ::bebop::define_serialize_chained!(*Self => |zelf, dest| {
        Ok(
            ::bebop::packed_read!(zelf.choice)._serialize_chained(dest)?
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

        Ok((i, Self { choice: v0 }))
    }
}

impl<'raw> ::bebop::Record<'raw> for Vote {}

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

    pub use super::ClientMessageType;

    pub use super::Vote;

    pub use super::AUDIENCE_LOBBY_TIME;

    pub use super::DRAWING_TIME;

    pub use super::Coord;

    pub use super::CursorLocation;

    pub use super::GamerChoice;

    pub use super::ClientType;
}
