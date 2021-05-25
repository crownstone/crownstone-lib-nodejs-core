import {
  FilterFormatFullAdData,
  FilterFormatMacAddress, FilterFormatMaskedAdData,
  FilterInputManufacturerId,
  FilterMetaData, FilterOutputDescription
} from "../packets/AssetFilters/FilterMetaDataPackets";
import {FilterInputType, FilterOutputDescriptionType, FilterType} from "../packets/AssetFilters/FilterTypes";
import {CuckooFilter} from "./filterModules/CuckooFilter";
import {Util} from "../util/Util";
import {ExactMatchFilter} from "./filterModules/ExactMatchFilter";

export const MAX_AMOUNT_OF_FILTERS = 8;

export class AssetFilter {

  filterType = null;
  filterTypeLocked = false;

  metaData : FilterMetaData;
  filter   : CuckooFilter | ExactMatchFilter = null;

  internalBuffer : Buffer[] = [];
  profileId : number;


  constructor(profileId: number = 255) {
    this.profileId  = profileId;
  }


  /**
   * Set your own filter meta data class instead of using the filterOn etc. methods
   * @param metaData
   */
  setMetaData(metaData: FilterMetaData) {
    this.metaData = metaData;
  }

  /**
   * Use the mac address as input data for the filter.
   */
  filterOnMacAddress() : AssetFilter {
    this._ensureMetaData();
    this.metaData.input = new FilterFormatMacAddress();
    return this;
  }

  /**
   * Use the manufacturerId as input data for the filter
   */
  filterOnManufacturerId() : AssetFilter {
    this._ensureMetaData();
    this.metaData.input = new FilterInputManufacturerId();
    return this;
  }

  /**
   * Use the ID and all the accompanying data of the provided adType as input data for the filter
   * @param adType
   */
  filterOnFullAdData(adType: number) : AssetFilter {
    this._ensureMetaData();
    this.metaData.input = new FilterFormatFullAdData(adType);
    return this;
  }

  /**
   * Use part of the provided ad type as the input data for the filter.
   * The mask is an uint32 bitmask, where every 1 in the bitmask will pass 1 byte of the ad type to the filter.
   * Example:
   *    adType 0xff (manufacturerData)
   *    mask   3    (bit 0 and bit 1 are 1, rest 0)
   *
   *    if the incoming advertisement is 0xff 0x09 0xcd 0x52 0x61 0xf2 0x63
   *    then the data that will be put into the filter is: 0x09cd because byte 0 and byte 1 are allowed through the mask.
   *
   * This example is also what the FilterInputManufacturerId class abstracts.
   * @param adType
   * @param mask
   */
  filterOnMaskedAdData(adType: number, mask: number) : AssetFilter {
    this._ensureMetaData();
    this.metaData.input = new FilterFormatMaskedAdData(adType, mask);
    return this;
  }

  /**
   * If an advertisement passes the filter, the Crownstone will send a report containing the mac address and rssi of the source of the advertisement to the hub.
   */
  outputMacRssiReport() : AssetFilter {
    this._ensureMetaData();
    this.metaData.outputDescription = new FilterOutputDescription(FilterOutputDescriptionType.MAC_ADDRESS_REPORT);
    return this;
  }


  /**
   * If an advertisement passes the filter, it will be passed on to the in-network localization algorithms and referred to as a 3 byte short id
   * basedOn will allow you to determine which identifying data will be used to construct this shortId.
   *
   * The network will update the hub with the nearestCrownstone to this device
   * @param basedOn
   */
  outputTrackableShortId(basedOn: FilterFormatMacAddress | FilterFormatFullAdData | FilterFormatMaskedAdData) : AssetFilter {
    this._ensureMetaData();
    this.metaData.outputDescription = new FilterOutputDescription(FilterOutputDescriptionType.SHORT_ASSET_ID_TRACK, basedOn)
    return this;
  }

  /**
   * Shorthand api method.
   */
  outputTrackableShortIdBasedOnMacAddress() : AssetFilter {
    return this.outputTrackableShortId(new FilterFormatMacAddress())
  }
  /**
   * Shorthand api method.
   */
  outputTrackableShortIdBasedOnFullAdType(adType: number) : AssetFilter {
    return this.outputTrackableShortId(new FilterFormatFullAdData(adType))
  }
  /**
   * Shorthand api method.
   */
  outputTrackableShortIdBasedOnMaskedAdType(adType: number, mask: number) : AssetFilter {
    return this.outputTrackableShortId(new FilterFormatMaskedAdData(adType, mask))
  }

  /**
   * If an advertisement passes the filter, the mesh will treat this as profileId X for behaviour. 255 here means no profileId (and will not be used by behaviour).
   * If the in-network localization cannot determine which room it is in (or the mode is set to macRssiReport) we will treat this as an in-sphere.
   * @param profileId
   */
  useAsProfileId(profileId: number) : AssetFilter {
    this._ensureMetaData();
    this.profileId = profileId ?? 255;
    this.metaData.profileId = this.profileId;
    return this;
  }


  /**
   * This allows you to set the type of filter to be used.
   * @param filterType
   */
  setFilterType(filterType: number) : AssetFilter {
    this._ensureMetaData();
    this.filterType = filterType;
    this.metaData.type = filterType;
    this.filterTypeLocked = true;
    return this;
  }


  _determineFilterType(): number {
    // already determined
    if (this.filterType !== null) { return this.filterType; }

    // nothing to base this on.
    if (this.internalBuffer.length === 0) { return FilterType.EXACT_MATCH; }

    // check consistent item size
    let itemLength = this.internalBuffer[0].length;
    let sameSize = true;
    for (let item of this.internalBuffer) {
      if (item.length !== itemLength) {
        sameSize = false;
        break;
      }
    }

    // check max filter size if uncompressed:
    let totalSize = itemLength * this.internalBuffer.length;

    // if all the data is of the same size and the total length is smaller than 400b, use an exactMatch filter
    // since compression is not required.
    if (sameSize && totalSize < 400) {
      return FilterType.EXACT_MATCH;
    }

    return FilterType.CUCKCOO_V1;
  }

  _determineItemSize() : number {
    if (this.internalBuffer.length === 0) { return 0; }
    return this.internalBuffer[0].length;
  }

  /**
   * Add your data to the filter. This data is normally ordered. The
   * @param data
   */
  addToFilter(data: Buffer) {
    // we construct a filter when we need the filterData or CRC. If we add more, the cached version is invalid.
    if (this.filter !== null) {
      this.filter = null;
    }

    // if the filter type is determined based on the data instead of configuration, set it to unknown when
    // the data changes.
    if (this.filterTypeLocked === false) {
      this.filterType = null;
    }


    this.internalBuffer.push(data);
  }


  /**
   * This packet is what will be transferred to a Crownstone. It is the full byte representation of the filter.
   */
  getFilterPacket() : Buffer {
    this._buildFilter();
    let filterPacket = Buffer.concat([this.metaData.getPacket(), this.filter.getPacket()])
    return filterPacket;
  }


  /**
   * Get the CRC of this filter
   */
  getCRC() : number {
    let packet = this.getFilterPacket();
    return Util.crc32(packet);
  }


  _ensureMetaData() {
    if (!this.metaData) { this.metaData = new FilterMetaData(this.profileId, this.filterType) }
  }

  _buildFilter() {
    if (!this.metaData)                   { throw "META_DATA_REQUIRED"; }
    if (!this.metaData.input)             { throw "META_DATA_INPUT_REQUIRED"; }
    if (!this.metaData.outputDescription) { throw "META_DATA_OUTPUT_DESCRIPTION_REQUIRED"; }

    this.filterType = this._determineFilterType();
    this.metaData.type = this.filterType;

    if (this.filter === null) {
      if (this.filterType === FilterType.CUCKCOO_V1) {
        this.filter = new CuckooFilter(this.internalBuffer.length);
      }
      else {
        this.filter = new ExactMatchFilter(this._determineItemSize());
      }

      // load the data into the filters. If the input is a mac address we have to treat it differently.
      if (this.metaData.input.type === FilterInputType.MAC_ADDRESS) {
        this._loadIntoFilterReversed();
      }
      else if (this.metaData.input instanceof FilterInputManufacturerId) {
        this._loadIntoFilterReversed();
      }
      else {
        this._loadIntoFilter();
      }
    }
  }

  _loadIntoFilterReversed() {
    for (let dataItem of this.internalBuffer) {
      // MAC addresses are reversed over the air. The firmware will not rotate all of them, so we do it here.
      // The same is true for manufactorer ID
      dataItem.reverse();
      this.filter.add(dataItem);
    }
  }

  _loadIntoFilter() {
    for (let dataItem of this.internalBuffer) {
      this.filter.add(dataItem);
    }
  }
}